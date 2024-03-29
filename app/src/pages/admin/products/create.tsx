import { createServerSideHelpers } from '@/lib/createServerSideHelpers';
import { type NextPageWithLayout } from '@/lib/types';
import { AdminLayout } from '@/modules/admin/layout';
import CreateProductScreen from '@/modules/admin/modules/product/screens/CreateProduct.screen';
import { type GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import React from 'react';

export async function getServerSideProps(
  context: GetServerSidePropsContext
) {
  const serverSideHelpers = await createServerSideHelpers(context);

  return {
    props: {
      trpcState: serverSideHelpers.dehydrate(),
    }
  }
}

const AdminCreateProductPage: NextPageWithLayout = () => {
  return (
    <CreateProductScreen />
  );
}

AdminCreateProductPage.Layout = AdminLayout;

export default AdminCreateProductPage;