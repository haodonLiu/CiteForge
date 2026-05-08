import { useNavigate } from 'react-router-dom';
import LiteratureList from '@/components/library/LiteratureList';

export default function Library() {
  const navigate = useNavigate();

  return (
    <LiteratureList
      onSelect={(id) => navigate(`/reader/${id}`)}
    />
  );
}
