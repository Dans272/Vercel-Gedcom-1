import { useCallback, useEffect, useMemo, useState } from 'react';
import { CirclePost, FamilyTree, Profile, User } from '../types';
import { STORAGE_KEYS } from '../constants';

export const useArchiveStore = (user: User | null) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [treeViewId, setTreeViewId] = useState<string | null>(null);
  const [circlePosts, setCirclePosts] = useState<CirclePost[]>([]);

  // Load user scoped data when user changes
  useEffect(() => {
    if (!user) return;
    const savedProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]') as Profile[];
    const savedTrees = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAMILY_TREES) || '[]') as FamilyTree[];
    const savedPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_POSTS) || '[]') as CirclePost[];

    setProfiles(
      savedProfiles
        .filter((p) => p.userId === user.id)
        .map((p) => ({
          ...p,
          parentIds: p.parentIds || [],
          childIds: p.childIds || [],
          spouseIds: p.spouseIds || [],
          timeline: p.timeline || [],
          memories: p.memories || [],
          media: p.media || []
        }))
    );
    setFamilyTrees(savedTrees.filter((t) => t.userId === user.id));
    setCirclePosts(savedPosts.filter((p) => p.userId === user.id));
  }, [user]);

  // Persist when data changes
  // Important: STORAGE_KEYS are global, so we must merge per-user data to avoid
  // overwriting other users' archives on the same device/browser.
  useEffect(() => {
    if (!user) return;

    const allProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]') as Profile[];
    const mergedProfiles = [
      ...allProfiles.filter((p) => p.userId !== user.id),
      ...profiles
    ];

    const allTrees = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAMILY_TREES) || '[]') as FamilyTree[];
    const mergedTrees = [
      ...allTrees.filter((t) => t.userId !== user.id),
      ...familyTrees
    ];

    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_POSTS) || '[]') as CirclePost[];
    const mergedPosts = [
      ...allPosts.filter((p) => p.userId !== user.id),
      ...circlePosts
    ];

    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(mergedProfiles));
      localStorage.setItem(STORAGE_KEYS.FAMILY_TREES, JSON.stringify(mergedTrees));
      localStorage.setItem(STORAGE_KEYS.CIRCLE_POSTS, JSON.stringify(mergedPosts));
    } catch (e) {
      console.error('Storage quota exceeded — archive may not be fully saved.', e);
      // Attempt to save trees at minimum (much smaller than profiles with base64 images)
      try {
        localStorage.setItem(STORAGE_KEYS.FAMILY_TREES, JSON.stringify(mergedTrees));
      } catch {
        // Nothing more we can do without a backend
      }
    }
  }, [profiles, familyTrees, circlePosts, user]);

  const addCirclePost = useCallback((post: CirclePost) => {
    setCirclePosts((prev) => [post, ...prev]);
  }, []);

  const deleteCirclePost = useCallback((id: string) => {
    setCirclePosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateCirclePost = useCallback((id: string, patch: Partial<CirclePost>) => {
    setCirclePosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [profiles, activeProfileId]
  );

  const selectedTree = useMemo(
    () => familyTrees.find((t) => t.id === selectedTreeId) || null,
    [familyTrees, selectedTreeId]
  );

  const selectedTreeForView = useMemo(
    () => familyTrees.find((t) => t.id === treeViewId) || null,
    [familyTrees, treeViewId]
  );

  const clearAll = () => {
    setProfiles([]);
    setFamilyTrees([]);
    setActiveProfileId(null);
    setSelectedTreeId(null);
    setTreeViewId(null);
    setCirclePosts([]);
  };

  return {
    profiles, setProfiles,
    familyTrees, setFamilyTrees,
    activeProfileId, setActiveProfileId,
    selectedTreeId, setSelectedTreeId,
    treeViewId, setTreeViewId,
    activeProfile, selectedTree, selectedTreeForView,
    circlePosts, addCirclePost, deleteCirclePost, updateCirclePost,
    clearAll
  };
};
