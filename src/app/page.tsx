'use client'

import {
  useUser,
  useOrganization,
  useOrganizationList,
} from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  console.log('Home')
  const router = useRouter();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: activeOrgLoaded } = useOrganization();
  const {
    userMemberships,
    isLoaded: listLoaded,
    setActive,
  } = useOrganizationList({ userMemberships: true });

  useEffect(() => {
    console.log('userLoaded:', userLoaded);
    console.log('listLoaded:', listLoaded);
    console.log('activeOrgLoaded:', activeOrgLoaded);
    console.log('isSignedIn:', isSignedIn);
    console.log('userMemberships:', userMemberships);
    console.log('organization:', organization);
    if (!userLoaded || !listLoaded || !activeOrgLoaded) return;
    if (!isSignedIn) return;

    if (!userMemberships.data || userMemberships.data.length === 0) {
      router.push('/create-organization');
      return;
    }

    if (!organization) {
      const firstOrg = userMemberships.data[0].organization;
      setActive({ organization: firstOrg }).then(() => {
        router.push('/dashboard');
      });
      return;
    }

    router.push('/dashboard');
  }, [
    isSignedIn,
    userLoaded,
    listLoaded,
    activeOrgLoaded,
    setActive,
    router,
    userMemberships.data,
    organization,
  ]);

  // フックの後でreturn null
  if (!userLoaded || !listLoaded || !activeOrgLoaded) {
    return null;
  }

  return null;
}
