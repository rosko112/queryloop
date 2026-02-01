import { test, expect } from '@playwright/test';
import { mockSupabase } from './utils/mockSupabase';

const baseQuestion = {
  id: 'q1',
  title: 'Test question',
  body: 'Question body',
  author_id: 'u1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  score: 0,
  is_closed: false,
  is_public: true,
};

const baseUser = {
  id: 'u1',
  username: 'alice',
  display_name: 'Alice',
  email: 'alice@example.com',
  reputation: 10,
  created_at: '2025-01-01T00:00:00Z',
  bio: 'Hello',
  is_admin: false,
};

test('about page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About QueryLoop' })).toBeVisible();
});

test('privacy page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test('login page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
});

test('register page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/register');
  await expect(page.getByText('Create your account')).toBeVisible();
});

test('tags page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/tags');
  await expect(page.getByRole('heading', { name: 'Browse Tags' })).toBeVisible();
});

test('questions list page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/question');
  await expect(page.getByRole('heading', { name: 'All Questions' })).toBeVisible();
});

test('ask question page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/question/ask');
  await expect(page.getByRole('heading', { name: 'Ask a Question' })).toBeVisible();
});

test('question detail page renders', async ({ page }) => {
  await mockSupabase(page, {
    rest: {
      questions: baseQuestion,
      users: [baseUser],
      questions_tags: [],
      votes: [],
      favorites: [],
      question_attachments: [],
      answers: [],
      answer_attachments: [],
    },
  });
  await page.goto('/question/q1');
  await expect(page.getByRole('heading', { name: 'Test question' })).toBeVisible();
});

test('answer form page renders', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/question/q1/answer');
  await expect(page.getByRole('heading', { name: 'Write Your Answer' })).toBeVisible();
});

test('public profile page renders', async ({ page }) => {
  await mockSupabase(page, {
    rest: {
      users: baseUser,
      questions: [baseQuestion],
    },
  });
  await page.goto('/u/alice');
  await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
  await expect(page.getByText('@alice')).toBeVisible();
});

test('admin user detail page renders', async ({ page }) => {
  await mockSupabase(page, {
    rest: {
      users: baseUser,
      questions: [],
      answers: [],
    },
  });
  await page.goto('/admin/user/u1');
  await expect(page.getByRole('heading', { name: /Alice's Posts/i })).toBeVisible();
});

test('profile page redirects to login when unauthenticated', async ({ page }) => {
  await mockSupabase(page, { authUser: null });
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});

test('edit profile page redirects to login when unauthenticated', async ({ page }) => {
  await mockSupabase(page, { authUser: null });
  await page.goto('/profile/edit-profile');
  await expect(page).toHaveURL(/\/login/);
});

test('admin page redirects to login when unauthenticated', async ({ page }) => {
  await mockSupabase(page, { authUser: null });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('auth callback redirects to login without session', async ({ page }) => {
  await mockSupabase(page, { authUser: null });
  await page.goto('/auth/callback');
  await expect(page).toHaveURL(/\/login/);
});
