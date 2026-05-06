# -*- mode: python ; coding: utf-8 -*-

import sys
import os
from pathlib import Path

block_cipher = None

# Get project root
project_root = Path(SPECPATH).parent

a = Analysis(
    ['launcher/main_launcher.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        (str(project_root / 'citeforge'), 'citeforge'),
        (str(project_root / 'config.yaml'), '.'),
    ],
    hiddenimports=[
        'citeforge',
        'citeforge.core',
        'citeforge.core.models',
        'citeforge.core.enums',
        'citeforge.core.consts',
        'citeforge.core.exceptions',
        'citeforge.workspace',
        'citeforge.workspace.manager',
        'citeforge.orchestrator',
        'citeforge.orchestrator.engine',
        'citeforge.agents',
        'citeforge.agents.researcher',
        'citeforge.agents.analyst',
        'citeforge.agents.writer',
        'citeforge.ingestion',
        'citeforge.retrieval',
        'citeforge.llm',
        'citeforge.search',
        'citeforge.web',
        'citeforge.web.app',
        'citeforge.export',
        'launcher.config_wizard',
        'launcher.main_launcher',
        'ttkbootstrap',
        'yaml',
        'pydantic',
        'pydantic_settings',
        'typer',
        'rich',
        'httpx',
        'streamlit',
        'chromadb',
        'pymupdf',
        'sentence_transformers',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='citeforge_launcher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# Alternative: single file executable (slower startup but single file)
# Uncomment below for onefile mode:
# exe = EXE(pyz, a.scripts, a.binaries, a.zipfiles, [],
#           name='citeforge_launcher',
#           debug=False,
#           runtime_tmpdir=None,
#           console=True,
#           onefile=True,
#           icon='')  # Add icon path here if needed