import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from './supabaseClient';
import { useAuth } from './AuthProvider';

const formatDate = (iso) => new Date(iso).toLocaleString();

const PostCard = ({ post }) => {
	const { user } = useAuth();
	const [upvotesCount, setUpvotesCount] = useState(0);
	const [hasUpvoted, setHasUpvoted] = useState(false);
	const [comments, setComments] = useState([]);
	const [commentInput, setCommentInput] = useState('');
	const [loadingUpvote, setLoadingUpvote] = useState(false);
	const [loadingComment, setLoadingComment] = useState(false);

	const loadStats = useCallback(async () => {
		const [{ data: upvotesData, error: upErr }, { data: commentsData, error: cErr }] = await Promise.all([
			supabase.from('upvotes').select('id, user_id').eq('post_id', post.id),
			supabase.from('comments').select('id, content, created_at, user_id').eq('post_id', post.id).order('created_at', { ascending: true }),
		]);
		if (upErr) console.error(upErr);
		if (cErr) console.error(cErr);
		setUpvotesCount(upvotesData?.length || 0);
		setHasUpvoted(!!upvotesData?.some((u) => u.user_id === user?.id));
		setComments(commentsData || []);
	}, [post.id, user?.id]);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	const handleUpvote = async () => {
		if (!user) {
			alert('Please sign in to upvote');
			return;
		}
		if (hasUpvoted) return;
		setLoadingUpvote(true);
		try {
			const { error } = await supabase.from('upvotes').insert({ post_id: post.id, user_id: user.id });
			if (error) throw error;
			setHasUpvoted(true);
			setUpvotesCount((c) => c + 1);
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to upvote');
		} finally {
			setLoadingUpvote(false);
		}
	};

	const handleAddComment = async (e) => {
		e.preventDefault();
		if (!user) {
			alert('Please sign in to comment');
			return;
		}
		if (!commentInput.trim()) return;
		setLoadingComment(true);
		try {
			const { data, error } = await supabase
				.from('comments')
				.insert({ post_id: post.id, user_id: user.id, content: commentInput.trim() })
				.select()
				.single();
			if (error) throw error;
			setComments((prev) => [...prev, data]);
			setCommentInput('');
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to add comment');
		} finally {
			setLoadingComment(false);
		}
	};

	const author = useMemo(() => post.user || post.author || {}, [post]);

	return (
		<div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div style={{ fontWeight: 600 }}>{author.email || author.name || 'Unknown User'}</div>
				<div style={{ color: '#6b7280', fontSize: 12 }}>{formatDate(post.created_at)}</div>
			</div>
			<div style={{ fontSize: 16, fontWeight: 600 }}>{post.title}</div>
			<div style={{ whiteSpace: 'pre-wrap' }}>{post.content}</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<button onClick={handleUpvote} disabled={loadingUpvote || hasUpvoted}>
					{hasUpvoted ? 'Upvoted' : 'Upvote'} ({upvotesCount})
				</button>
			</div>
			<div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
				<div style={{ fontWeight: 600, marginBottom: 6 }}>Comments</div>
				<div style={{ display: 'grid', gap: 6 }}>
					{comments.map((c) => (
						<div key={c.id} style={{ background: '#f9fafb', borderRadius: 6, padding: 8 }}>
							<div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(c.created_at)}</div>
							<div>{c.content}</div>
						</div>
					))}
				</div>
				<form onSubmit={handleAddComment} style={{ marginTop: 8, display: 'grid', gap: 6 }}>
					<textarea
						rows={2}
						placeholder="Add a comment"
						value={commentInput}
						onChange={(e) => setCommentInput(e.target.value)}
						disabled={loadingComment}
					/>
					<button type="submit" disabled={loadingComment || !user}>
						{loadingComment ? 'Posting...' : 'Comment'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default PostCard;


