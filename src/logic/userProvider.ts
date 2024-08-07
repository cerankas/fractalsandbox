import { useCallback, useEffect, useState } from "react";
import { isBrowser } from "~/components/browserUtils";
import { api } from "~/utils/api";

type User = { id: string, name: string; image: string };

export const loadUsersFromLocalStorage = () => JSON.parse(localStorage.getItem('userCache') ?? '[]') as User[];

export default function useUserProvider(requiredUserIds: string[]) {
  const [cachedUsers, setCachedUsers] = useState<User[]>(isBrowser ? loadUsersFromLocalStorage() : []);
  const [request, setRequest] = useState<string[]>([]);

  useEffect(() => {
    setRequest(requiredUserIds.filter(userId => cachedUsers.find(cachedUser => cachedUser.id === userId) === undefined));
  }, [cachedUsers, requiredUserIds]);
  
  const setAndSaveUsers = useCallback((newUsers: User[]) => {
    setCachedUsers(newUsers);
    localStorage.setItem('userCache', JSON.stringify(newUsers));
  }, []);
  
  const { data: newData } = api.user.findMany.useQuery({ids: request}, {enabled: request.length !== 0});

  useEffect(() => {
    if (!newData?.find(user => !cachedUsers.find(cachedUser => cachedUser.id === user.id))) return;
    setAndSaveUsers([...cachedUsers, ...newData ?? []]);
  }, [newData, cachedUsers, setAndSaveUsers]);

  return { users: cachedUsers };
}