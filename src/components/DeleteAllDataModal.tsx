import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { db } from "../db";

export function DeleteAllDataModal({ onOpen }: { onOpen: () => void }) {
  const [opened, { open, close }] = useDisclosure(false, { onOpen });

  return (
    <>
      <Button
        onClick={open}
        variant="outline"
        color="red"
        leftIcon={<IconTrash size={20} />}
      >
        Удалить все базы данных
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title="Удалить все базы данных"
        size="md"
        withinPortal
      >
        <Stack>
          <Text size="sm">Вы уверены, что хотите удалить свои данные?</Text>
          <Button
            onClick={async () => {
              await db.delete();
              localStorage.clear();
              window.location.assign("/");
            }}
            color="red"
          >
            Удалить
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
