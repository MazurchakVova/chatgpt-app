import {
  Alert,
  Anchor,
  Button,
  Flex,
  List,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { cloneElement, ReactElement, useEffect, useState } from "react";
import { db } from "../db";
import { availableModels, defaultModel } from "../utils/constants";
import { checkOpenAIKey } from "../utils/openai";

export function SettingsModal({ children }: { children: ReactElement }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  const [value, setValue] = useState("");
  const [model, setModel] = useState(defaultModel);

  const settings = useLiveQuery(async () => {
    return db.settings.where({ id: "general" }).first();
  });

  useEffect(() => {
    if (settings?.openAiApiKey) {
      setValue(settings.openAiApiKey);
    }
    if (settings?.openAiModel) {
      setModel(settings.openAiModel);
    }
  }, [settings]);

  return (
    <>
      {cloneElement(children, { onClick: open })}
      <Modal opened={opened} onClose={close} title="Настройки" size="lg">
        <Stack>
          <form
            onSubmit={async (event) => {
              try {
                setSubmitting(true);
                event.preventDefault();
                await checkOpenAIKey(value);
                await db.settings.where({ id: "general" }).modify((apiKey) => {
                  apiKey.openAiApiKey = value;
                  console.log(apiKey);
                });
                notifications.show({
                  title: "Сохранено",
                  message: "Ваш ключ OpenAI был сохранен.",
                });
              } catch (error: any) {
                if (error.toJSON().message === "Network Error") {
                  notifications.show({
                    title: "Ошибка",
                    color: "red",
                    message: "Нет подключения.",
                  });
                }
                const message = error.response?.data?.error?.message;
                if (message) {
                  notifications.show({
                    title: "Ошибка",
                    color: "red",
                    message,
                  });
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Flex gap="xs" align="end">
              <PasswordInput
                label="Ключ OpenAI API"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                sx={{ flex: 1 }}
                value={value}
                onChange={(event) => setValue(event.currentTarget.value)}
                formNoValidate
              />
              <Button type="submit" loading={submitting}>
                Сохранить
              </Button>
            </Flex>
          </form>
          <List withPadding>
            <List.Item>
              <Text size="sm">
                <Anchor
                  href="https://platform.openai.com/account/api-keys"
                  target="_blank"
                >
                  Получить ваш ключ OpenAI API
                </Anchor>
              </Text>
            </List.Item>
            <List.Item>
              <Text size="sm" color="dimmed">
                Ключ API хранится локально в вашем браузере и никогда не
                отправляется где-нибудь еще.
              </Text>
            </List.Item>
          </List>
          <Select
            label="Модель OpenAI"
            value={model}
            onChange={(value) => {
              db.settings.update("general", {
                openAiModel: value ?? undefined,
              });
            }}
            withinPortal
            data={availableModels}
          />
          <Alert color="orange" title="Warning">
            Отображаемая стоимость еще не была обновлена, чтобы отражать затраты
            для каждого модель. Сейчас он всегда будет показывать стоимость
            GPT-3.5.
          </Alert>
        </Stack>
      </Modal>
    </>
  );
}
