import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define exactly what a Post looks like
export type Post = {
  id: string;
  title: string;
  location: string;
  type: 'Lost' | 'Found';
  date: string;
  description: string;
  reportedBy: string;
  department: string;
  semester: string;
  contact: string;
  status: string;
  imageUri: string | null;
};

// Define the tools our screens are allowed to use
interface PostContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'date' | 'status'>) => void;
  deletePost: (id: string) => void;
  updatePostStatus: (id: string, newStatus: string) => void;
}

export const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);

  // 1. When the app opens, load saved posts from the phone's hard drive
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const storedPosts = await AsyncStorage.getItem('@campus_posts');
        if (storedPosts) {
          setPosts(JSON.parse(storedPosts));
        }
      } catch (error) {
        console.error("Failed to load posts", error);
      }
    };
    loadPosts();
  }, []);

  // 2. Whenever 'posts' changes, save the new list to the hard drive
  useEffect(() => {
    const savePosts = async () => {
      try {
        await AsyncStorage.setItem('@campus_posts', JSON.stringify(posts));
      } catch (error) {
        console.error("Failed to save posts", error);
      }
    };
    savePosts();
  }, [posts]);

  // 3. Global Action: Add a new post
  const addPost = (postData: Omit<Post, 'id' | 'date' | 'status'>) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(), // Generates a unique ID
      date: new Date().toLocaleDateString(), // Stamps today's date
      status: 'Active',
    };
    // Put the new post at the top of the feed
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // 4. Global Action: Delete a post
  const deletePost = (id: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
  };

  // 5. Global Action: Update status
  const updatePostStatus = (id: string, newStatus: string) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === id ? { ...post, status: newStatus } : post
    ));
  };

  return (
    <PostContext.Provider value={{ posts, addPost, deletePost, updatePostStatus }}>
      {children}
    </PostContext.Provider>
  );
};
