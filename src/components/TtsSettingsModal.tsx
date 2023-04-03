import React, { useState, useEffect } from "react";
import { Modal, Select, Slider, Button, Box } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";

export type TtsSettings = {
  rate: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
};

type TtsSettingsModalProps = {
  settings: TtsSettings;
  onChange: (settings: TtsSettings) => void;
};

export const TtsSettingsModal: React.FC<TtsSettingsModalProps> = ({
  settings,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [localVolume, setLocalVolume] = useState<number>(settings.volume);
  const [localRate, setLocalRate] = useState<number>(settings.rate);

  useEffect(() => {
    const voiceList = window.speechSynthesis
      .getVoices()
      .filter((v) => v.lang.startsWith("ru"));
    if (voiceList.length) {
      setVoices(voiceList);
    } else {
      const onLoadedVoices = () => {
        const filteredVoiceList = window.speechSynthesis
          .getVoices()
          .filter((v) => v.lang.startsWith("ru"));
        setVoices(filteredVoiceList);
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          onLoadedVoices
        );
      };
      window.speechSynthesis.addEventListener("voiceschanged", onLoadedVoices);
    }
  }, []);

  const handleRateChange = (value: number) => setLocalRate(value);

  const handleVolumeChange = (value: number) => setLocalVolume(value);

  const handleSubmit = () => {
    onChange({ ...settings, volume: localVolume, rate: localRate });
    setIsOpen(false);
  };

  const handleVoiceChange = (value: string | null) => {
    const voice = voices.find((v) => v.voiceURI === value) || null;
    onChange({ ...settings, voice });
  };

  const close = () => {
    setIsOpen(false);
    handleSubmit();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="md" color="gray">
        <IconSettings size={24} />
      </Button>

      <Modal
        title="Настройки озвучивания"
        opened={isOpen}
        onClose={close}
        size="sm"
        style={{ maxWidth: "380px" }}
      >
        <Slider
          label="Скорость"
          min={0}
          max={1.5}
          step={0.1}
          value={localRate}
          onChange={handleRateChange}
          marks={[
            { value: 0, label: "0" },
            { value: 1.5, label: "1.5" },
          ]}
        />
        <Box style={{ height: "25px" }} />
        <Slider
          label="Громкость"
          min={0}
          max={1}
          step={0.1}
          value={localVolume}
          onChange={handleVolumeChange}
          marks={[
            { value: 0, label: "0" },
            { value: 1, label: "1" },
          ]}
        />
        <Box style={{ height: "25px" }} />
        <Select
          label="Голос"
          value={settings.voice?.voiceURI || ""}
          onChange={handleVoiceChange}
          data={voices.map((voice) => ({
            value: voice.voiceURI,
            label: `${voice.name} (${voice.lang})`,
          }))}
          placeholder="Выберите голос"
          clearable
        />
      </Modal>
    </>
  );
};
