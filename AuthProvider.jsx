import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import supabase from './supabaseClient';

const AuthContext = createContext({
	user: null,
	session: null,
	signInWithGoogle: async () => {},
	signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		async function init() {
			const { data } = await supabase.auth.getSession();
			if (!active) return;
			setSession(data.session ?? null);
			setUser(data.session?.user ?? null);
			setLoading(false);
		}
		init();

		const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession);
			setUser(newSession?.user ?? null);
		});

		return () => {
			active = false;
			listener.subscription.unsubscribe();
		};
	}, []);

	const signInWithGoogle = async () => {
		const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined;
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo },
		});
		if (error) throw error;
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	};

	const value = useMemo(() => ({ user, session, loading, signInWithGoogle, signOut }), [user, session, loading]);

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;


