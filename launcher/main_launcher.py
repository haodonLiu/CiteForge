"""PCA-Lite GUI Launcher - Main Window."""
import subprocess
import sys
import os
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import ttkbootstrap as ttkb
from ttkbootstrap.constants import *

from pca_lite.core.consts import DIR_RAW_PDFS

CONFIG_PATH = Path.home() / ".pca" / "config.yaml"
PROJECT_DIR_VAR = None
TOPIC_VAR = None
FILE_LIST_VAR = None
STATUS_TEXT = None
PROCESS = None


def check_python_version():
    if sys.version_info < (3, 10):
        messagebox.showerror("Python 版本错误", "需要 Python 3.10 或更高版本")
        sys.exit(1)


def ensure_config():
    if not CONFIG_PATH.exists():
        from launcher.config_wizard import check_config_exists, run_wizard
        if not check_config_exists():
            run_wizard()


def browse_project_folder():
    folder = filedialog.askdirectory(title="选择项目文件夹")
    if folder:
        PROJECT_DIR_VAR.set(folder)


def create_new_folder():
    current = PROJECT_DIR_VAR.get()
    if not current:
        current = str(Path.home())
    new_folder = filedialog.askdirectory(title="创建新文件夹", initialdir=current)
    if new_folder:
        PROJECT_DIR_VAR.set(new_folder)


def add_pdf_files():
    files = filedialog.askopenfilenames(
        title="选择 PDF 文件",
        filetypes=[("PDF 文件", "*.pdf"), ("所有文件", "*.*")]
    )
    if files:
        current = FILE_LIST_VAR.get()
        if current:
            existing = [f.strip() for f in current.split(", ") if f.strip()]
        else:
            existing = []
        for f in files:
            if f not in existing:
                existing.append(f)
        FILE_LIST_VAR.set(", ".join(existing))


def clear_files():
    FILE_LIST_VAR.set("")


def copy_files_to_workspace(project_dir: Path, files: list[str]):
    raw_dir = project_dir / DIR_RAW_PDFS
    raw_dir.mkdir(parents=True, exist_ok=True)
    imported = []
    for f in files:
        src = Path(f)
        if src.exists():
            dest = raw_dir / src.name
            import shutil
            shutil.copy2(src, dest)
            imported.append(src.name)
    return imported


def launch_streamlit(project_dir: Path, topic: str):
    global PROCESS, STATUS_TEXT

    topic = topic.strip()
    if not topic:
        messagebox.showwarning("输入错误", "请输入综述主题")
        return
    if not project_dir or not Path(project_dir).exists():
        messagebox.showwarning("路径错误", "请选择有效的项目文件夹")
        return

    STATUS_TEXT.set("正在准备环境...")

    files = FILE_LIST_VAR.get()
    if files:
        file_list = [f.strip() for f in files.split(",") if f.strip()]
        imported = copy_files_to_workspace(Path(project_dir), file_list)
        STATUS_TEXT.set(f"已复制 {len(imported)} 个 PDF 文件到工作区")

    cmd = [
        sys.executable, "-m", "streamlit", "run",
        "pca_lite/web/app.py",
        "--server.port", "8501",
        "--browser.gatherUsageStats", "false",
    ]

    try:
        env = os.environ.copy()
        workspace = Path(project_dir) / "workspace"
        workspace.mkdir(parents=True, exist_ok=True)
        env["PCA_WORKSPACE"] = str(workspace)

        PROCESS = subprocess.Popen(
            cmd,
            cwd=str(Path(__file__).parent.parent),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        STATUS_TEXT.set("Streamlit 已启动，请在浏览器中查看 http://localhost:8501")
        messagebox.showinfo("启动成功", "Streamlit Web UI 已启动\n请访问 http://localhost:8501")

    except Exception as e:
        STATUS_TEXT.set(f"启动失败: {e}")
        messagebox.showerror("启动失败", str(e))


def main():
    check_python_version()
    ensure_config()

    root = ttkb.Window(themename="cosmo")
    root.title("PCA-Lite Launcher")
    root.geometry("700x500")
    root.resizable(False, False)

    global PROJECT_DIR_VAR, TOPIC_VAR, FILE_LIST_VAR, STATUS_TEXT
    PROJECT_DIR_VAR = tk.StringVar(value=str(Path.home() / "pca_projects"))
    TOPIC_VAR = tk.StringVar()
    FILE_LIST_VAR = tk.StringVar()
    STATUS_TEXT = tk.StringVar(value="就绪")

    style = ttk.Style()
    style.configure("Title.TLabel", font=("Segoe UI", 16, "bold"))
    style.configure("SubTitle.TLabel", font=("Segoe UI", 10))

    main_frame = ttkb.Frame(root, padding=20)
    main_frame.pack(fill="both", expand=True)

    ttkb.Label(main_frame, text="PCA-Lite", font=("Segoe UI", 20, "bold")).pack(pady=(0, 5))
    ttkb.Label(main_frame, text="面向论文综述的多 Agent 协作框架",
               font=("Segoe UI", 10), bootstyle="secondary").pack(pady=(0, 20))

    input_frame = ttkb.Frame(main_frame)
    input_frame.pack(fill="x", pady=10)

    ttkb.Label(input_frame, text="📁 项目文件夹:", font=("Segoe UI", 10)).grid(row=0, column=0, sticky="w", pady=8)
    ttkb.Entry(input_frame, textvariable=PROJECT_DIR_VAR, width=45).grid(row=0, column=1, padx=5)
    ttkb.Button(input_frame, text="浏览...", command=browse_project_folder,
                bootstyle="outline", width=8).grid(row=0, column=2, padx=2)
    ttkb.Button(input_frame, text="新建", command=create_new_folder,
                bootstyle="outline", width=8).grid(row=0, column=3, padx=2)

    ttkb.Label(input_frame, text="📝 综述主题:", font=("Segoe UI", 10)).grid(row=1, column=0, sticky="w", pady=8)
    ttkb.Entry(input_frame, textvariable=TOPIC_VAR, width=55).grid(row=1, column=1, columnspan=3, sticky="ew", padx=5)

    ttkb.Label(input_frame, text="📄 PDF 文件:", font=("Segoe UI", 10)).grid(row=2, column=0, sticky="nw", pady=8)
    file_frame = ttkb.Frame(input_frame)
    file_frame.grid(row=2, column=1, columnspan=3, sticky="ew", padx=5)
    ttkb.Button(file_frame, text="添加文件", command=add_pdf_files,
                bootstyle="outline", width=10).pack(side="left", padx=(0, 5))
    ttkb.Button(file_frame, text="清空", command=clear_files,
                bootstyle="outline", width=6).pack(side="left")
    ttkb.Label(file_frame, textvariable=FILE_LIST_VAR, foreground="gray",
               font=("Segoe UI", 8)).pack(fill="x", pady=(5, 0))

    sep = ttkb.Separator(main_frame, orient="horizontal")
    sep.pack(fill="x", pady=15)

    btn_frame = ttkb.Frame(main_frame)
    btn_frame.pack(pady=10)

    config_btn = ttkb.Button(
        btn_frame, text="⚙️ 首次配置向导",
        command=lambda: (
            __import__("launcher.config_wizard", fromlist=["run_wizard"]).run_wizard()
        ),
        bootstyle="secondary", width=15
    )
    config_btn.pack(side="left", padx=5)

    launch_btn = ttkb.Button(
        btn_frame, text="🚀 启动 Web UI",
        command=lambda: launch_streamlit(PROJECT_DIR_VAR.get(), TOPIC_VAR.get()),
        bootstyle="success", width=18
    )
    launch_btn.pack(side="left", padx=5)

    status_bar = ttkb.Label(main_frame, textvariable=STATUS_TEXT,
                           bootstyle="info", relief="sunken", anchor="w")
    status_bar.pack(fill="x", pady=(20, 0))

    root.mainloop()


if __name__ == "__main__":
    main()