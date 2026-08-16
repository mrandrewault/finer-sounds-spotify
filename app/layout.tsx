export const metadata = {
  title: "Finer Sounds → Spotify",
  description: "Automatically add Finer Sounds Spotify embeds to a Spotify playlist."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 760, margin: "60px auto", padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
