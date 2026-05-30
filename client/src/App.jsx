import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getProfile } from "./data";
import Auth from "./components/Auth.jsx";
import Shell from "./components/Shell.jsx";
import { BrandSplash } from "./components/bits.jsx";

export default function App() {
  const [user, setUser] = useState(null);     // firebase user
  const [profile, setProfile] = useState(null); // firestore user profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await getProfile(u.uid);
          setProfile(p);
        } catch { setProfile(null); }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);

  if (loading) return <BrandSplash />;

  // signed in via Firebase but profile not created yet (edge case) → treat as auth
  if (!user || !profile) {
    return <Auth onReady={setProfile} />;
  }

  return <Shell profile={profile} onLogout={logout} refreshProfile={async () => setProfile(await getProfile(user.uid))} />;
}
