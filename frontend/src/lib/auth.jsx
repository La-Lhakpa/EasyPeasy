// EasyPeasy auth
// ---------------------------------------------------------------------------
// Users sign in with a NAME + 4-digit PIN — the simplest possible flow for
// homemakers with low digital literacy. Supabase Auth, however, works in terms
// of email + password. We bridge the two invisibly:
//   • email    = a stable hash of the (normalized) name, so names in any script
//                (English, नेपाली, বাংলা) map to a valid, unique address.
//   • password = a deterministic value derived from the PIN that satisfies
//                Supabase's 6-char minimum.
// The learner never sees an email — only their name and PIN.
//
// If Supabase keys aren't configured yet, everything falls back to on-device
// "local accounts" so signup/login still work for development and demos.

import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase.js";

const ACCOUNTS_KEY = "easypeasy:accounts";
const SESSION_KEY = "easypeasy:session";
const LEGACY_FLAG = "easypeasy:signedIn";
const AUTH_EVENT = "easypeasy:auth-change";

// ---------------------------------------------------------------------------
// Derivations shared by both backends
// ---------------------------------------------------------------------------

export function normalizeName(name) {
  return (name || "").normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function emailForName(name) {
  const hash = await sha256Hex(normalizeName(name));
  return `u${hash.slice(0, 24)}@users.easypeasy.app`;
}

function passwordForPin(pin) {
  return `ezp_${pin}_v1`; // deterministic, >= 6 chars to satisfy Supabase
}

async function hashPin(pin, key) {
  return sha256Hex(`${pin}:${key}:easypeasy`);
}

// Returns an error code (mapped to a translated message in the UI) or null.
export function validateCredentials(name, pin) {
  if (!normalizeName(name)) return "no_name";
  if (!/^\d{4}$/.test(pin || "")) return "bad_pin";
  return null;
}

// ---------------------------------------------------------------------------
// Supabase backend
// ---------------------------------------------------------------------------

function toSupabaseUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.user_metadata?.display_name || "" };
}

function mapSupabaseError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) return "name_taken";
  if (msg.includes("invalid login")) return "invalid_credentials";
  if (msg.includes("not confirmed")) return "confirm_email";
  return "generic";
}

const supabaseBackend = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return toSupabaseUser(data.session?.user);
  },
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(toSupabaseUser(session?.user));
    });
    return () => data.subscription.unsubscribe();
  },
  async signUp(name, pin) {
    const email = await emailForName(name);
    const password = passwordForPin(pin);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name.trim() } },
    });
    if (error) return { error: mapSupabaseError(error) };
    // If email confirmation is enabled, signUp won't return a session. Try an
    // immediate sign-in; if that fails, the project needs "Confirm email" off.
    if (!data.session) {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) return { error: "confirm_email" };
      return { user: toSupabaseUser(res.data.user) };
    }
    return { user: toSupabaseUser(data.user) };
  },
  async signIn(name, pin) {
    const email = await emailForName(name);
    const password = passwordForPin(pin);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapSupabaseError(error) };
    return { user: toSupabaseUser(data.user) };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};

// ---------------------------------------------------------------------------
// Local (on-device) backend — used until Supabase keys are added
// ---------------------------------------------------------------------------

function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function setLocalSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_FLAG, "true");
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_FLAG);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

const localBackend = {
  async getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  },
  onChange(cb) {
    const handler = () => this.getSession().then(cb);
    window.addEventListener(AUTH_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  },
  async signUp(name, pin) {
    const key = normalizeName(name);
    const accounts = loadAccounts();
    if (accounts[key]) return { error: "name_taken" };
    accounts[key] = { name: name.trim(), pinHash: await hashPin(pin, key) };
    saveAccounts(accounts);
    const user = { id: key, name: name.trim() };
    setLocalSession(user);
    return { user };
  },
  async signIn(name, pin) {
    const key = normalizeName(name);
    const account = loadAccounts()[key];
    if (!account) return { error: "no_account" };
    if (account.pinHash !== (await hashPin(pin, key))) return { error: "invalid_credentials" };
    const user = { id: key, name: account.name };
    setLocalSession(user);
    return { user };
  },
  async signOut() {
    setLocalSession(null);
  },
};

const backend = isSupabaseConfigured ? supabaseBackend : localBackend;

// ---------------------------------------------------------------------------
// React context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;
    backend.getSession().then((user) => {
      if (active) setState({ loading: false, user });
    });
    const unsubscribe = backend.onChange((user) => {
      if (active) setState({ loading: false, user });
    });
    return () => {
      active = false;
      unsubscribe && unsubscribe();
    };
  }, []);

  // Wrap the backend calls so a successful result updates context state
  // immediately (synchronously, before the caller navigates) rather than waiting
  // on the async auth-change event. This avoids the route guard briefly seeing a
  // stale "signed out" state right after login/signup.
  const signUp = async (name, pin) => {
    const res = await backend.signUp(name, pin);
    if (res.user) setState({ loading: false, user: res.user });
    return res;
  };
  const signIn = async (name, pin) => {
    const res = await backend.signIn(name, pin);
    if (res.user) setState({ loading: false, user: res.user });
    return res;
  };
  const signOut = async () => {
    await backend.signOut();
    setState({ loading: false, user: null });
  };

  const value = {
    user: state.user,
    loading: state.loading,
    isSignedIn: Boolean(state.user),
    usingSupabase: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
