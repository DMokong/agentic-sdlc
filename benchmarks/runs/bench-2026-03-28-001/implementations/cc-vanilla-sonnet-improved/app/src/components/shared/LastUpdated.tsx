import { formatLastUpdated } from '../../utils/time';

interface LastUpdatedProps {
  date: Date | null;
}

export function LastUpdated({ date }: LastUpdatedProps) {
  if (!date) return null;
  return (
    <p className="text-xs text-gray-500 text-right">
      Updated {formatLastUpdated(date)}
    </p>
  );
}
