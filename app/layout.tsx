export const metadata = {
  title: "프로그램 신청",
  description: "Vercel + GitHub 파일 저장 기반 신청 앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial" }}>
        {children}
      </body>
    </html>
  );
}
