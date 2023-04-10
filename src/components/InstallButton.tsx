declare global {
  interface Window {
    BeforeInstallPromptEvent: BeforeInstallPromptEvent;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform?: string;
    }>;
    prompt(): Promise<void>;
  }
}

// InstallButton.tsx
import { useEffect } from "react";

const InstallButton: React.FC = () => {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    const onBeforeInstallPrompt = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      deferredPrompt = e;
      e.preventDefault();

      // Отображаем кнопку для установки
      const installButton = document.createElement("button");
      installButton.innerText = "Установить приложение";
      document.body.appendChild(installButton);

      // Обработчик нажатия на кнопку установки
      installButton.addEventListener("click", () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
              console.log("Пользователь принял запрос на установку");
            } else {
              console.log("Пользователь отклонил запрос на установку");
            }
            deferredPrompt = null;
          });
        }
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  // DOM для кнопки устанавливается в useEffect,
  // поэтому возвращаем пустой фрагмент.
  return <></>;
};

export default InstallButton;
