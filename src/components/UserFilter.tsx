import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { TbUsers } from "react-icons/tb";
import { type User } from "~/logic/userProvider";

export default function UserFilter(props: {users: User[], filteredUserId: string, setFilteredUserId: (userId: string) => void}) {
  const [expanded, setExpanded] = useState(false);
  const filteredUser = useMemo(() => props.users.find(user => user.id === props.filteredUserId), [props.filteredUserId, props.users]);
  const selectUser = (userId: string) => { props.setFilteredUserId(userId); setExpanded(false); };
  const { user: signedInUser } = useUser();

  useEffect(() => {
    if (expanded) {
      const setExpandedFalse = (e: KeyboardEvent) => { setExpanded(false); e.stopPropagation(); }
      document.addEventListener('keydown', setExpandedFalse, true);
      return () => document.removeEventListener('keydown', setExpandedFalse, true);
    }
  }, [expanded]);

  return <div className="relative">
    {filteredUser !== undefined ? 
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        src={filteredUser.image} alt="" draggable="false"
        className="rounded-full size-6 m-1 cursor-pointer" 
        onMouseDown={(e) => {
          if (e.button === 0) setExpanded(true);
          if (e.button === 2) props.setFilteredUserId('');
        }}
        title={"Filter: " + filteredUser.name} 
      />
      :
      <span className="flex m-1 rounded-full bg-gray-300 size-6 justify-center items-center cursor-pointer">
        <TbUsers
          onPointerDown={(e) => {
            if (e.button === 0) setExpanded(true);
            if (e.button === 2) props.setFilteredUserId(signedInUser?.id ?? '');
          }}
          title={"Filter: all"} 
        />
      </span>
    }
    {expanded && <div className="fixed inset-0 z-40 bg-black opacity-50" onClick={() => setExpanded(false)}/>}
    {expanded && <div className="absolute left-0 top-0 flex flex-col rounded z-50 border-2 bg-white border-black">
      <div style={props.filteredUserId === '' ? {backgroundColor:'lightgray', borderRadius: 2} : {}}>
        <span className="flex m-1 rounded-full bg-gray-300 size-6 justify-center items-center cursor-pointer">
          <TbUsers
            onClick={() => selectUser('')}
            title={"Filter: all"} 
            />
        </span>
      </div>
      {signedInUser && 
        <div style={props.filteredUserId === signedInUser.id ? {backgroundColor:'lightgray', borderRadius: 2} : {}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={signedInUser.imageUrl} alt="" draggable="false"
            className="rounded-full size-6 m-1 cursor-pointer" 
            onClick={() => selectUser(signedInUser.id)}
            title={"Filter: " + signedInUser.fullName} 
            />
        </div>
      }
      {props.users
      .filter(user => user.id !== signedInUser?.id && user.id)
      .map(user => 
        <div key={user.id} style={props.filteredUserId === user.id ? {backgroundColor:'lightgray', borderRadius: 2} : {}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={user.image} alt="" draggable="false"
            className="rounded-full size-6 m-1 cursor-pointer" 
            onClick={() => selectUser(user.id)}
            title={"Filter: " + user.name} 
          />
        </div>
      )}
    </div>}
  </div>;
}