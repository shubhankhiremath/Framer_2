import React, { useState } from 'react';
import supabase from './supabaseClient';
import { useAuth } from './AuthProvider';

const PostForm = ({ onCreated }) => {
	const { user } = useAuth();
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!user) {
			alert('Please sign in to post');
			return;
		}
		if (!title.trim() || !content.trim()) {
			alert('Title and content are required');
			return;
		}
		setSubmitting(true);
		try {
			const { data, error } = await supabase
				.from('posts')
				.insert({ title, content, user_id: user.id })
				.select()
				.single();
			if (error) throw error;
			setTitle('');
			setContent('');
			onCreated && onCreated(data);
			alert('Post created');
		} catch (err) {
			console.error(err);
			alert(err.message || 'Failed to create post');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
			<input
				type="text"
				placeholder="Title"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				disabled={submitting}
			/>
			<textarea
				placeholder="What's on your mind?"
				rows={4}
				value={content}
				onChange={(e) => setContent(e.target.value)}
				disabled={submitting}
			/>
			<button type="submit" disabled={submitting || !user}>
				{submitting ? 'Posting...' : 'Post'}
			</button>
		</form>
	);
};

export default PostForm;


