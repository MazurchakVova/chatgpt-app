import { Button, Card, Flex, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDatabaseExport, IconDatabaseImport } from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import download from "downloadjs";
import { cloneElement, ReactElement } from "react";
import { db } from "../db";
import { DeleteAllDataModal } from "./DeleteAllDataModal";
import { DeleteChatsModal } from "./DeleteChatsModal";

export function DatabaseModal({ children }: { children: ReactElement }) {
  const [opened, { open, close }] = useDisclosure(false);
  const chatsCount = useLiveQuery(async () => {
    return (await db.chats.toArray()).length;
  }, []);
  const messagesCount = useLiveQuery(async () => {
    return (await db.messages.toArray()).length;
  }, []);
  const promptsCount = useLiveQuery(async () => {
    return (await db.prompts.toArray()).length;
  });

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal
        opened={opened}
        onClose={close}
        title="База данных"
        size="lg"
        withinPortal
        keepMounted
      >
        <Stack>
          <Flex>
            <Card withBorder sx={{ flex: 1 }}>
              <Text size="xl" align="center">
                {chatsCount}
              </Text>
              <Text
                size="xs"
                color="dimmed"
                align="center"
                tt="uppercase"
                fw={700}
              >
                Чаты
              </Text>
            </Card>
            <Card withBorder sx={{ flex: 1, marginLeft: -1 }}>
              <Text size="xl" align="center">
                {messagesCount}
              </Text>
              <Text
                size="xs"
                color="dimmed"
                align="center"
                tt="uppercase"
                fw={700}
              >
                Сообщения
              </Text>
            </Card>
            <Card withBorder sx={{ flex: 1, marginLeft: -1 }}>
              <Text size="xl" align="center">
                {promptsCount}
              </Text>
              <Text
                size="xs"
                color="dimmed"
                align="center"
                tt="uppercase"
                fw={700}
              >
                Prompts
              </Text>
            </Card>
          </Flex>
          <Group>
            <Button
              variant="default"
              leftIcon={<IconDatabaseExport size={20} />}
              onClick={async () => {
                const blob = await db.export();
                download(
                  blob,
                  `chatpad-export-${new Date().toLocaleString()}.json`,
                  "application/json"
                );
                notifications.show({
                  title: "Экспортирование базы данных",
                  message: "Ваша база данных была экспортирована.",
                });
              }}
            >
              Экспортировать базу данных
            </Button>
            <input
              id="file-upload-btn"
              type="file"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (!file) return;
                db.import(file, {
                  acceptNameDiff: true,
                  overwriteValues: true,
                  acceptMissingTables: true,
                  clearTablesBeforeImport: true,
                })
                  .then(() => {
                    notifications.show({
                      title: "Импорт базы данных",
                      message: "Ваша база данных была импортирована.",
                    });
                  })
                  .catch((error) => {
                    notifications.show({
                      title: "Ошибка",
                      color: "red",
                      message: "Выбранный вами файл не подходит для системы",
                    });
                  });
              }}
              accept="application/json"
              hidden
            />
            <Button
              component="label"
              htmlFor="file-upload-btn"
              variant="default"
              leftIcon={<IconDatabaseImport size={20} />}
            >
              Импортировать базу данных
            </Button>
          </Group>
          <Group>
            <DeleteChatsModal onOpen={close} />
            <DeleteAllDataModal onOpen={close} />
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
