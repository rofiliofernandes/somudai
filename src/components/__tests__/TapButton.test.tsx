import { fireEvent, render, screen } from '@testing-library/react-native';
import { TapButton } from '../TapButton';
import type { FeedPost } from '../../types/db';

const mockMutate = jest.fn();
let mockSession: object | null = { user: { id: 'u1' } };

jest.mock('../../hooks/useTap', () => ({ useTap: () => ({ mutate: mockMutate }) }));
jest.mock('../../hooks/useSession', () => ({ useSession: () => ({ session: mockSession }) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const base: FeedPost = {
  id: 'p1',
  matter_id: 1,
  matter_name: 'Environment',
  type: 'action',
  title: 'Beach Cleanup at Morjim',
  summary: '',
  description: null,
  area: 'North Goa',
  place: null,
  starts_at: new Date(Date.now() + 86_400_000).toISOString(),
  organiser_name: 'Goa Green Collective',
  image_path: null,
  tap_count: 1284,
  tapped: false,
};

beforeEach(() => {
  mockMutate.mockClear();
  router.push.mockClear();
  mockSession = { user: { id: 'u1' } };
});

it('ready action says "I\'m joining" and Taps', async () => {
  await render(<TapButton post={base} source="home" />);
  await fireEvent.press(screen.getByText("I'm joining"));
  expect(mockMutate).toHaveBeenCalledWith({ postId: 'p1', tapped: false }, expect.anything());
  expect(screen.getByLabelText("I'm joining Beach Cleanup at Morjim. 1,284 joined.")).toBeTruthy();
});

it('joined action says "Joined" and un-Taps', async () => {
  await render(<TapButton post={{ ...base, tapped: true }} source="home" />);
  await fireEvent.press(screen.getByText('Joined'));
  expect(mockMutate).toHaveBeenCalledWith({ postId: 'p1', tapped: true }, expect.anything());
});

it('stance states use stance words', async () => {
  const stance = { ...base, type: 'stance' as const, starts_at: null };
  const { rerender } = await render(<TapButton post={stance} source="home" />);
  expect(screen.getByText('I stand with this')).toBeTruthy();
  await rerender(<TapButton post={{ ...stance, tapped: true }} source="home" />);
  expect(screen.getByText('Standing with this')).toBeTruthy();
});

it('ended action is disabled and never Taps', async () => {
  const ended = { ...base, starts_at: new Date(Date.now() - 3_600_000).toISOString() };
  await render(<TapButton post={ended} source="detail" />);
  await fireEvent.press(screen.getByText('Event ended'));
  expect(mockMutate).not.toHaveBeenCalled();
});

it('signed-out visitors go to Welcome and come back to the post', async () => {
  mockSession = null;
  await render(<TapButton post={base} source="detail" />);
  await fireEvent.press(screen.getByText("I'm joining"));
  expect(mockMutate).not.toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith({ pathname: '/welcome', params: { returnTo: '/post/p1' } });
});
