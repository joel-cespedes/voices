import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import type { DeckId } from '../../domain/deck';
import { I18nService } from '../i18n/i18n.service';
import { PracticeStore } from '../practice/practice.store';

/**
 * Bottom-sheet menu with the available lists (decks). Picking one switches the
 * practice view to it. Visibility is controlled by the parent.
 */
@Component({
  selector: 'app-deck-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deck-menu.html',
  styleUrl: './deck-menu.css',
})
export class DeckMenu {
  protected readonly store = inject(PracticeStore);
  protected readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected select(deckId: DeckId): void {
    void this.store.selectDeck(deckId);
    this.closed.emit();
  }
}
