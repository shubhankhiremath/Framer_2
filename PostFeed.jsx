import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from './supabaseClient';
import AuthProvider, { useAuth } from './AuthProvider';
import PostCard from './PostCard';
import PostForm from './PostForm';

const PAGE_SIZE = 20;

const PostFeedInner = () => {
	const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [page, setPage] = useState(0);

	const loadPosts = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			// Fetch posts ordered by created_at desc
			const { data, error: err } = await supabase
				.from('posts')
				.select('id, title, content, created_at, user_id')
				.order('created_at', { ascending: false })
				.limit(PAGE_SIZE)
				.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
			if (err) throw err;
			setPosts(data || []);
		} catch (e) {
			console.error(e);
			setError(e.message || 'Failed to load posts');
		} finally {
			setLoading(false);
		}
	}, [page]);

	useEffect(() => {
		loadPosts();
	}, [loadPosts]);

	const onCreated = useCallback(() => {
		setPage(0);
		loadPosts();
	}, [loadPosts]);

	const header = useMemo(() => (
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<div style={{ fontWeight: 700 }}>Chatly Feed</div>
			<div>
				{authLoading ? null : user ? (
					<button onClick={signOut}>Sign out</button>
				) : (
					<button onClick={signInWithGoogle}>Sign in with Google</button>
				)}
			</div>
		</div>
	), [authLoading, user, signInWithGoogle, signOut]);

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			{header}
			{user && <PostForm onCreated={onCreated} />}
			{loading && <div>Loading...</div>}
			{error && <div style={{ color: 'red' }}>{error}</div>}
			<div style={{ display: 'grid', gap: 12 }}>
				{posts.map((p) => (
					<PostCard key={p.id} post={p} />
				))}
			</div>
			<div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
				<button disabled={page === 0} onClick={() => setPage((n) => Math.max(0, n - 1))}>Prev</button>
				<button onClick={() => setPage((n) => n + 1)}>Next</button>
			</div>
		</div>
	);
};

const PostFeed = () => {
	return (
		<AuthProvider>
			<PostFeedInner />
		</AuthProvider>
	);
};

export default PostFeed;


