import { Badge, Button, Center, Container, Group } from "@mantine/core";
import {
  IconCurrencyDollar,
  IconKey,
  IconLock,
  IconNorthStar,
} from "@tabler/icons-react";
import { useLiveQuery } from "dexie-react-hooks";
import { SettingsModal } from "../components/SettingsModal";
import { db } from "../db";

export function IndexRoute() {
  const settings = useLiveQuery(() => db.settings.get("general"));
  const { openAiApiKey } = settings ?? {};

  return (
    <>
      <Center py="xl" sx={{ height: "100%" }}>
        <Container size="sm">
          <Badge mb="lg">GPT-4 Ready</Badge>
          <Group mt={10}>
            <SettingsModal>
              <Button
                size="md"
                variant={openAiApiKey ? "light" : "filled"}
                leftIcon={<IconKey size={20} />}
              >
                {openAiApiKey ? "Изменить ключ OpenAI" : "Ввести ключ OpenAI"}
              </Button>
            </SettingsModal>
          </Group>
        </Container>
      </Center>
    </>
  );
}

const features = [
  {
    icon: IconCurrencyDollar,
    title: "Бесплатно и с открытым исходным кодом",
    description:
      "Это приложение предоставляется бесплатно, а исходный код доступен на GitHub.",
  },
  {
    icon: IconLock,
    title: "Фокус на приватности",
    description:
      "Никакого отслеживания, никаких файлов cookie, без проблем. Все ваши данные хранятся локально.",
  },
  {
    icon: IconNorthStar,
    title: "Лучший опыт",
    description:
      "Создано с любовью и заботой о том, чтобы предоставить наилучший возможный опыт.",
  },
];
