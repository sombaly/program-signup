export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GITHUB_TOKEN_SET: !!process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH,
    GITHUB_PROGRAMS_PATH: process.env.GITHUB_PROGRAMS_PATH,
    GITHUB_SUBMISSIONS_PATH: process.env.GITHUB_SUBMISSIONS_PATH,
  });
}
