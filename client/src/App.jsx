import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getProfile } from "./data";
import Auth from "./components/Auth.jsx";
import Shell from "./components/Shell.jsx";
import { BrandSplash } from "./components/bits.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("wf-theme") || "dark");

  // theme → <html data-theme>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("wf-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try { setProfile(await getProfile(u.uid)); } catch { setProfile(null); }
      } else { setProfile(null); }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);

  return (
    <>
      {/* animated mesh background */}
      <div className="app-bg" aria-hidden>
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" /><div className="orb o4" />
      </div>

      {loading ? (
        <BrandSplash />
      ) : !user || !profile ? (
        <Auth onReady={setProfile} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <Shell
          profile={profile}
          onLogout={logout}
          theme={theme}
          onToggleTheme={toggleTheme}
          refreshProfile={async () => setProfile(await getProfile(user.uid))}
        />
      )}
    </>
  );
}
