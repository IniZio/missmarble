/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useCallback, useEffect, useState } from 'react';
import { NextPageWithLayout } from '@/lib/types';
import { AdminLayout } from '../../../layout';
import Translated from '@/components/Translated';

import { type ColumnDef } from "@tanstack/react-table"
import { FormattedMessage } from 'react-intl';
import { type Translation } from '@/models/translation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Upload from '@/components/ui/upload';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from '@/components/ui/spinner';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/router';
import { Routes } from 'generated';
import { ModuleHeader, ModuleHeaderDescription, ModuleHeaderTitle } from '../../../components/module-header';
import { useGetProductFieldDetail } from '../actions/getProductFieldDetail';
import ProductFieldForm from '../components/ProductFieldForm';
import { useSaveProductField } from '../actions/saveProductField';
import { type EditAdminProductField } from '../models/productFIeld';
import { useDeleteProductField } from '../actions/deleteProductFIeld';

export interface ProductFieldDetailScreenProps {
  productFieldId: string;
}

  const ProductFieldDetailScreen: React.FC<ProductFieldDetailScreenProps> = ({ productFieldId }) => {
  const { data: productFieldDetail } = useGetProductFieldDetail(productFieldId);
  const [saveProductField, { isLoading: isCreatingProduct }] = useSaveProductField();
  const [deleteProductField, { isLoading: isDeletingProductField }] = useDeleteProductField();

  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = useCallback(async (data: EditAdminProductField) => {
    await saveProductField(data);
    toast({
      title: 'Product field updated',
    });
  }, [saveProductField, toast])

  const onDelete = useCallback(async () => {
    await deleteProductField(productFieldId);
    toast({
      title: 'Product field deleted',
    });
    await router.replace(Routes.AdminProductFieldListPage());
  } , [deleteProductField, productFieldId, router, toast]);

  if (!productFieldDetail) {
    return <p>Loading...</p>
  }

  return (
    <div>
      <ModuleHeader>
        <div>
          <ModuleHeaderTitle>Product Field</ModuleHeaderTitle>
          <ModuleHeaderDescription>
            <Translated t={productFieldDetail.name} />
          </ModuleHeaderDescription>
        </div>
      </ModuleHeader>

      <Card className="mt-4">
        <CardContent className="pt-6">
        <ProductFieldForm productFieldDetail={productFieldDetail} onSubmit={onSubmit} onDelete={onDelete} />
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductFieldDetailScreen