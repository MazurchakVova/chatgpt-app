import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Textarea,
  TextareaProps,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useLiveQuery } from "dexie-react-hooks";
import { findLast } from "lodash";
import { nanoid } from "nanoid";
import { useState, useRef, useEffect } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { MessageItem } from "../components/MessageItem";
import { db } from "../db";
import { useChatId } from "../hooks/useChatId";
import {
  writingCharacters,
  writingFormats,
  writingStyles,
  writingTones,
} from "../utils/constants";
import { createChatCompletion } from "../utils/openai";
import { useActiveTextToSpeech } from "../hooks/useActiveTextToSpeech";
import { TtsSettings, TtsSettingsModal } from "../components/TtsSettingsModal";

import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function ChatRoute() {
  const chatId = useChatId();
  const apiKey = useLiveQuery(async () => {
    return (await db.settings.where({ id: "general" }).first())?.openAiApiKey;
  });
  const messages = useLiveQuery(() => {
    if (!chatId) return [];
    return db.messages.where("chatId").equals(chatId).sortBy("createdAt");
  }, [chatId]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const chat = useLiveQuery(async () => {
    if (!chatId) return null;
    return db.chats.get(chatId);
  }, [chatId]);

  const [writingCharacter, setWritingCharacter] = useState<string | null>(null);
  const [writingTone, setWritingTone] = useState<string | null>(null);
  const [writingStyle, setWritingStyle] = useState<string | null>(null);
  const [writingFormat, setWritingFormat] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const recognitionRef = useRef<any | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textToSpeechControl = useActiveTextToSpeech();

  const [ttsSettings, setTtsSettings] = useState<TtsSettings>({
    rate: 0.9,
    volume: 0.6,
    voice: null,
  });

  useEffect(() => {
    if (window.SpeechRecognition || (window as any).webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.interimResults = true;
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = "ru-RU";
      recognitionRef.current.maxAlternatives = 1000;

      recognitionRef.current.onerror = (event: any) =>
        console.error(event.error);

      recognitionRef.current.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setContent(
              (prevState) => prevState + event.results[i][0].transcript
            );
            setInterimTranscript("");
          } else {
            setInterimTranscript(event.results[i][0].transcript);
          }
        }
      };

      recognitionRef.current.onspeechstart = () => {
        setIsMicActive(true);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        } else {
          setIsMicActive(false);
          setContent((prevState) => prevState + interimTranscript);
        }
      };
    } else {
      console.log("API распознавания речи не поддерживается этим браузером");
    }
  }, []);

  const startRecording = () => {
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    inputRef.current?.focus();
  };

  const getSystemMessage = () => {
    const message: string[] = [];
    if (writingCharacter) message.push(`You are ${writingCharacter}.`);
    if (writingTone) message.push(`Respond in ${writingTone} tone.`);
    if (writingStyle) message.push(`Respond in ${writingStyle} style.`);
    if (writingFormat) message.push(writingFormat);
    if (message.length === 0)
      message.push("ChatGPT, большая языковая модель, обученная OpenAI.");
    return message.join(" ");
  };

  const submit = async () => {
    if (submitting || isRecording) return;
    if (submitting) return;

    if (!chatId) {
      notifications.show({
        title: "Ошибка",
        color: "red",
        message:
          "Идентификатор чата не определен. Пожалуйста, создайте чат, чтобы начать.",
      });
      return;
    }

    if (!apiKey) {
      notifications.show({
        title: "Error",
        color: "red",
        message:
          "Ключ OpenAI API не определен. Пожалуйста, установите ключ API",
      });
      return;
    }

    try {
      setSubmitting(true);

      await db.messages.add({
        id: nanoid(),
        chatId,
        content,
        role: "user",
        createdAt: new Date(),
      });
      setContent("");

      const result = await createChatCompletion(apiKey, [
        {
          role: "system",
          content: getSystemMessage(),
        },
        ...(messages ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        { role: "user", content },
      ]);

      const assistantMessage = result.data.choices[0].message?.content;
      if (result.data.usage) {
        await db.chats.where({ id: chatId }).modify((chat) => {
          if (chat.totalTokens) {
            chat.totalTokens += result.data.usage!.total_tokens;
          } else {
            chat.totalTokens = result.data.usage!.total_tokens;
          }
        });
      }
      setSubmitting(false);

      await db.messages.add({
        id: nanoid(),
        chatId,
        content: assistantMessage ?? "unknown response",
        role: "assistant",
        createdAt: new Date(),
      });

      if (chat?.description === "Новый чат") {
        const messages = await db.messages
          .where({ chatId })
          .sortBy("createdAt");
        const createChatDescription = await createChatCompletion(apiKey, [
          {
            role: "system",
            content: getSystemMessage(),
          },
          ...(messages ?? []).map((message) => ({
            role: message.role,
            content: message.content,
          })),
          {
            role: "user",
            content:
              "Каким должно быть короткое и подходящее название для этого чата? Вы должны строго отвечать только заголовком, другой текст не допускается.",
          },
        ]);
        const chatDescription =
          createChatDescription.data.choices[0].message?.content;

        if (createChatDescription.data.usage) {
          await db.chats.where({ id: chatId }).modify((chat) => {
            chat.description = chatDescription ?? "Новый чат";
            if (chat.totalTokens) {
              chat.totalTokens +=
                createChatDescription.data.usage!.total_tokens;
            } else {
              chat.totalTokens = createChatDescription.data.usage!.total_tokens;
            }
          });
        }
      }
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
  };

  if (!chatId) return null;

  return (
    <>
      <Container pt="xl" pb={100}>
        <Stack spacing="xs">
          {messages?.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              textToSpeechControl={textToSpeechControl}
              ttsSettings={ttsSettings}
            />
          ))}
        </Stack>
        {submitting && (
          <Card withBorder mt="xs">
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} radius="xl" />
            <Skeleton height={8} mt={6} width="70%" radius="xl" />
          </Card>
        )}
      </Container>
      <Box
        py="lg"
        sx={(theme) => ({
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          [`@media (min-width: ${theme.breakpoints.md})`]: {
            left: 300,
          },
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.gray[0],
        })}
      >
        <Container>
          {messages?.length === 0 && (
            <SimpleGrid
              mb="sm"
              spacing="xs"
              breakpoints={[
                { minWidth: "sm", cols: 4 },
                { maxWidth: "sm", cols: 2 },
              ]}
            >
              <Select
                value={writingCharacter}
                onChange={setWritingCharacter}
                data={writingCharacters}
                placeholder="Характер"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingTone}
                onChange={setWritingTone}
                data={writingTones}
                placeholder="Тон"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingStyle}
                onChange={setWritingStyle}
                data={writingStyles}
                placeholder="Стиль"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
              <Select
                value={writingFormat}
                onChange={setWritingFormat}
                data={writingFormats}
                placeholder="Формат"
                variant="filled"
                searchable
                clearable
                sx={{ flex: 1 }}
              />
            </SimpleGrid>
          )}

          <Flex gap="sm">
            <TtsSettingsModal
              settings={ttsSettings}
              onChange={setTtsSettings}
            />
            <Button
              size="md"
              onClick={isRecording ? stopRecording : startRecording}
              className={isMicActive ? "mic-active" : ""}
            >
              {isRecording ? (
                <IconMicrophoneOff size={24} />
              ) : (
                <IconMicrophone size={24} />
              )}
            </Button>
            <div
              className={
                isRecording ? "textarea-wrapper recording" : "textarea-wrapper"
              }
            >
              <Textarea
                key={chatId}
                sx={{ flex: 1 }}
                placeholder="Напишите ваше сообщение..."
                autosave
                autosize={true}
                autoFocus={true}
                className={isRecording ? "textarea-recording" : ""}
                disabled={submitting}
                minRows={1}
                maxRows={10}
                value={content}
                readOnly={isRecording}
                ref={inputRef}
                onChange={(event) => setContent(event.currentTarget.value)}
                onKeyDown={async (event) => {
                  if (event.code === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                  if (event.code === "ArrowUp") {
                    const { selectionStart, selectionEnd } =
                      event.currentTarget;
                    if (selectionStart !== selectionEnd) return;
                    if (selectionStart !== 0) return;
                    event.preventDefault();
                    const nextUserMessage = findLast(
                      messages,
                      (message) => message.role === "user"
                    );
                    setContent(nextUserMessage?.content ?? "");
                  }
                  if (event.code === "ArrowDown") {
                    const { selectionStart, selectionEnd } =
                      event.currentTarget;
                    if (selectionStart !== selectionEnd) return;
                    if (selectionStart !== event.currentTarget.value.length)
                      return;
                    event.preventDefault();
                    const lastUserMessage = findLast(
                      messages,
                      (message) => message.role === "user"
                    );
                    if (lastUserMessage?.content === content) {
                      setContent("");
                    }
                  }
                }}
              />
            </div>

            <Button
              size="md"
              onClick={() => {
                submit();
              }}
            >
              <AiOutlineSend />
            </Button>
          </Flex>
        </Container>
      </Box>
    </>
  );
}
