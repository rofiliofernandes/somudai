import { EmptyState } from './EmptyState';

type Props = {
  onRetry: () => void;
  message?: string;
};

/** Plain-words error with Try again. Never shows a raw error message. */
export function ErrorState({ onRetry, message = "Couldn't load this. Check your connection." }: Props) {
  return <EmptyState message={message} action={{ label: 'Try again', onPress: onRetry }} />;
}
