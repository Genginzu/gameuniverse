import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the discussions/messaging page.
 */
export class DiscussionsPage extends BasePage {
  async goto(locale: string = "fr") {
    await this.navigateTo(`/${locale}/discussions`);
  }

  get page_() {
    return this.getByTestId("discussions-page");
  }

  get conversationList(): Locator {
    return this.getByTestId("conversation-list");
  }

  get conversationItems(): Locator {
    return this.getByTestId("conversation-item");
  }

  get newConversationButton(): Locator {
    return this.getByTestId("new-conversation-button");
  }

  get messageThread(): Locator {
    return this.getByTestId("message-thread");
  }

  get messageInput(): Locator {
    return this.getByTestId("message-input");
  }

  get sendButton(): Locator {
    return this.getByTestId("message-send-button");
  }

  get messageBubbles(): Locator {
    return this.getByTestId("message-bubble");
  }

  get unreadBadge(): Locator {
    return this.getByTestId("unread-badge");
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }
}
