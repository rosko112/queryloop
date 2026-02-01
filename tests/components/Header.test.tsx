import { render, screen, waitFor } from '@testing-library/react';
import Header from '@/app/components/Header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const createClientComponentClientMock = createClientComponentClient as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

const createSupabaseClient = (options: {
  authUser?: { id: string } | null;
  profile?: {
    id: string;
    username: string;
    display_name?: string | null;
    email: string;
    is_admin: boolean;
  } | null;
}) => {
  const authUser = options.authUser ?? null;
  const profile = options.profile ?? null;

  const queryChain = {
    select: jest.fn(() => queryChain),
    eq: jest.fn(() => queryChain),
    maybeSingle: jest.fn(async () => ({ data: profile, error: null })),
  };

  return {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: authUser } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn(async () => ({ error: null })),
    },
    from: jest.fn(() => queryChain),
  };
};

describe('Header', () => {
  it('renders login/register links when unauthenticated', async () => {
    useRouterMock.mockReturnValue({ push: jest.fn() });
    createClientComponentClientMock.mockReturnValue(
      createSupabaseClient({ authUser: null, profile: null })
    );

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });

  it('shows admin panel and user name for admin users', async () => {
    useRouterMock.mockReturnValue({ push: jest.fn() });
    createClientComponentClientMock.mockReturnValue(
      createSupabaseClient({
        authUser: { id: 'user-1' },
        profile: {
          id: 'user-1',
          username: 'admin',
          display_name: 'Admin User',
          email: 'admin@example.com',
          is_admin: true,
        },
      })
    );

    render(<Header />);

    expect(await screen.findByText('Admin Panel')).toBeInTheDocument();
    expect(await screen.findByText('Admin User')).toBeInTheDocument();
  });
});