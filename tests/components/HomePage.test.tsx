import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

jest.mock('@/app/components/Header', () => () => <div data-testid="header" />);

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const createClientComponentClientMock = createClientComponentClient as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

describe('HomePage', () => {
  it('renders top questions and featured tags from Supabase', async () => {
    useRouterMock.mockReturnValue({ push: jest.fn() });

    const questions = [
      {
        id: 'q1',
        title: 'How to test?',
        author_id: 'u1',
        created_at: '2025-01-01T00:00:00Z',
        score: 2,
      },
    ];
    const users = [{ id: 'u1', username: 'alice' }];
    const questionsTags = [
      {
        question_id: 'q1',
        tags: { id: 't1', name: 'testing' },
      },
    ];
    const votes = [
      { target_id: 'q1', value: 1 },
      { target_id: 'q1', value: -1 },
    ];
    const tags = [{ id: 't1', name: 'testing' }];

    const responseByTable: Record<string, { data: any[]; error: null }> = {
      questions: { data: questions, error: null },
      users: { data: users, error: null },
      questions_tags: { data: questionsTags, error: null },
      votes: { data: votes, error: null },
      tags: { data: tags, error: null },
    };

    const buildQuery = (table: string) => {
      const response = responseByTable[table] ?? { data: [], error: null };
      const chain: any = {
        select: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        order: jest.fn(() => chain),
        limit: jest.fn(async () => response),
        in: jest.fn(async () => response),
      };
      chain.then = (resolve: (value: any) => void) => Promise.resolve(response).then(resolve);
      return chain;
    };

    createClientComponentClientMock.mockReturnValue({
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null } })),
        getUser: jest.fn(async () => ({ data: { user: null } })),
      },
      from: jest.fn((table: string) => buildQuery(table)),
    });

    render(<HomePage />);

    expect(await screen.findByText('Top questions')).toBeInTheDocument();
    expect(await screen.findByText('How to test?')).toBeInTheDocument();
    const tagMatches = await screen.findAllByText('testing');
    expect(tagMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Join QueryLoop')).toBeInTheDocument();
  });
});
