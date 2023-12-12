"use client"

import * as z from "zod";
import { Description } from "@prisma/client";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";

const formSchema = z.object({
    description: z.string().min(1).max(1200),
})

interface DescriptionFormProps {
    initialData: Description | null;
}

type DescriptionFormValues = z.infer<typeof formSchema>

export const DescriptionForm: React.FC<DescriptionFormProps> = ({
    initialData
}) => {

    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Editar descrição" : "Criar descrição";
    const description = initialData ? "Editar uma descrição" : "Criar uma nova descrição"
    const toastMessage = initialData ? "Descrição Modificada" : "Descrição Criada"
    const action = initialData ? "Salvar Alterações" : "Criar"

    const form = useForm<DescriptionFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            description: '',
        }
    });

    const onSubmit = async (data: DescriptionFormValues) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/descriptions/${params.descriptionId}`, data);
            } else {
                await axios.post(`/api/${params.storeId}/descriptions`, data);
            }
            router.refresh();
            router.push(`/${params.storeId}/descriptions`)
            toast.success(toastMessage);
        } catch (error) {
            toast.error("Algo deu errado.");
        } finally {
            setLoading(false);
        }
    }

    const onDelete = async () => {
        try {
            setLoading(true)
            await axios.delete(`/api/${params.storeId}/descriptions/${params.descriptionId}`)
            router.refresh();
            router.push(`/${params.storeId}/descriptions`)
            toast.success("Descrição deletada.");
        } catch (error) {
            toast.error("Certique-se de que você removeu todos os produtos usando essa descrição primeiro.")
        } finally {
            setLoading(false)
            setOpen(false)
        }
    }

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading
                    title={title}
                    description={description}
                />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="icon"
                        onClick={() => setOpen(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Descrição do Produto" {...field} className="h-32" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button disabled={loading} className="ml-auto" type="submit">{action}</Button>
                </form>
            </Form>
        </>
    )
}