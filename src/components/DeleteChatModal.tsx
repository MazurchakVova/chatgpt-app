import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-location";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { Chat, db } from "../db";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";

export function DeleteChatModal({
  chat,
  children,
}: {
  chat: Chat;
  children: ReactElement;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [key, setKey] = useApiKey();

  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(key);
  }, [key]);
  const chatId = useChatId();
  const navigate = useNavigate();

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal opened={opened} onClose={close} title="Удалить чат">
        <form
          onSubmit={async (event) => {
            try {
              setSubmitting(true);
              event.preventDefault();
              await db.chats.where({ id: chat.id }).delete();
              await db.messages.where({ chatId: chat.id }).delete();
              if (chatId === chat.id) {
                navigate({ to: `/` });
              }
              close();

              notifications.show({
                title: "Удаление",
                message: "Чат удален",
              });
            } catch (error: any) {
              if (error.toJSON().message === "Network Error") {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message: "Нет подключения.",
                });
              } else {
                notifications.show({
                  title: "Error",
                  color: "red",
                  message:
                    "Не могу удалить чат. Пожалуйста, обновите страницу и повторите попытку.",
                });
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Stack>
            <Text size="sm">Вы уверены, что хотите удалить этот чат?</Text>
            <Button type="submit" color="red" loading={submitting}>
              Удалить
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
