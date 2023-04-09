import {
  ActionIcon,
  Box,
  Card,
  Code,
  CopyButton,
  Flex,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { IconCopy, IconUser } from "@tabler/icons-react";
import { useMemo, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../db";
import "../styles/markdown.scss";
import { CreatePromptModal } from "./CreatePromptModal";
import { LogoIcon } from "./Logo";
import { ScrollIntoView } from "./ScrollIntoView";
import { IconVolumeOff, IconVolume } from "@tabler/icons-react";

type MessageItemProps = {
  message: Message;
  ttsSettings: any;
  textToSpeechControl: {
    activeId: string | null;
    toggleActive: (id: string) => void;
  };
};

export function MessageItem({
  message,
  textToSpeechControl,
  ttsSettings,
}: MessageItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const wordCount = useMemo(() => {
    var matches = message.content.match(/[\w\d\'\'-\(\)]+/gi);
    return matches ? matches.length : 0;
  }, [message.content]);

  useEffect(() => {
    if (isPlaying && textToSpeechControl.activeId !== message.id) {
      setIsPlaying(false);
    }
  }, [textToSpeechControl.activeId, isPlaying]);

  function speakText(index = 0, chunkSize = 300) {
    const { voice, rate, volume } = ttsSettings;
    textToSpeechControl.toggleActive(message.id);

    if (index < message.content.length) {
      const utterance = new SpeechSynthesisUtterance(
        message.content.slice(index, index + chunkSize)
      );

      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = rate;
      utterance.volume = volume;

      utterance.onend = () => {
        speakText(index + chunkSize, chunkSize);
      };

      speechSynthesis.speak(utterance);
    } else {
      console.log("All text spoken");
      setIsPlaying(false);
    }
  }

  const handleTextToSpeechToggle = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText();
    }
  };

  return (
    <ScrollIntoView>
      <Card withBorder>
        <Flex gap="sm">
          {message.role === "user" && (
            <ThemeIcon color="gray" size="lg">
              <IconUser size={20} />
            </ThemeIcon>
          )}
          {message.role === "assistant" && <LogoIcon style={{ height: 32 }} />}
          <Box sx={{ flex: 1, width: 0 }} className="markdown">
            <ReactMarkdown
              children={message.content}
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <Table verticalSpacing="sm" highlightOnHover {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <Code {...props} />
                  ) : (
                    <Box sx={{ position: "relative" }}>
                      <Code block {...props} />
                      <CopyButton value={String(props.children)}>
                        {({ copied, copy }) => (
                          <Tooltip
                            label={copied ? "Copied" : "Copy"}
                            position="left"
                          >
                            <ActionIcon
                              sx={{ position: "absolute", top: 4, right: 4 }}
                              onClick={copy}
                            >
                              <IconCopy opacity={0.4} size={20} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Box>
                  ),
              }}
            />
            {message.role === "assistant" && (
              <Box>
                <Text size="sm" color="dimmed">
                  {wordCount} words
                </Text>
              </Box>
            )}
          </Box>

          <Box>
            <CopyButton value={message.content}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copied" : "Copy"} position="left">
                  <ActionIcon onClick={copy}>
                    <IconCopy opacity={0.5} size={20} />
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>

            <Tooltip label={isPlaying ? "Stop" : "Play"} position="left">
              <ActionIcon onClick={handleTextToSpeechToggle}>
                {isPlaying ? (
                  <IconVolumeOff opacity={0.5} size={20} />
                ) : (
                  <IconVolume opacity={0.5} size={20} />
                )}
              </ActionIcon>
            </Tooltip>

            <CreatePromptModal content={message.content} />

            {/* <Tooltip label={`${wordCount} words`} position="left">
              <ActionIcon>
                <IconInfoCircle opacity={0.5} size={20} />
              </ActionIcon>
            </Tooltip> */}
          </Box>
        </Flex>
      </Card>
    </ScrollIntoView>
  );
}
