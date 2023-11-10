import { Auth } from "aws-amplify";
import useSWR from "swr";
import { User } from "../@types/user";

type UserInterface = {
  attributes: {
    sub: string;
    email: string;
  }
}

const fallbackData = { username: '...', isAdmin: false };

const fetchUser = () => {
  return Auth.currentUserInfo().then((data: UserInterface) => ({
    username: data.attributes.email,
    isAdmin: data.attributes.sub == 'b835edfb-59b7-4559-bbb0-72337169575b',
  })) as Promise<User>;
};

export const useUser = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data } = useSWR<User>('user', fetchUser, { fallbackData });

  return {
    username: data?.username,
    isAdmin: data?.isAdmin,
  }
};
