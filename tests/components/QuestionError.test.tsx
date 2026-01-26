import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionError from '@/app/components/QuestionError';
import { useRouter } from 'next/navigation';

jest.mock('@/app/components/Header', () => () => <div data-testid="header" />);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const useRouterMock = useRouter as jest.Mock;

describe('QuestionError', () => {
  it('navigates back to home on button click', async () => {
    const push = jest.fn();
    useRouterMock.mockReturnValue({ push });

    render(<QuestionError error="Something went wrong" />);

    await userEvent.click(screen.getByRole('button', { name: /back to home/i }));

    expect(push).toHaveBeenCalledWith('/');
  });
});