import { Component, ChangeDetectionStrategy, computed, effect, inject, input, output, signal } from '@angular/core';
import { NgClass, KeyValuePipe } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { TranslationPipe, TranslationService } from '@angulartoolsdr/translation';

export interface FilterOption {
  nome: string;
  id?: number;
  group?: string;
  nomeCaixa?: string;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'lib-dropdown-filter',
  imports: [NgClass, KeyValuePipe, MatMenuModule, MatIconButton, TranslationPipe],
  templateUrl: './dropdown-filter.html',
  styleUrls: ['./dropdown-filter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownFilter {

  readonly options = input<FilterOption[]>([]);
  readonly multiple = input(false);
  readonly prefix = input<string>();
  readonly showPrefix = input(false);
  readonly value = input<FilterOption | FilterOption[] | null>(null);

  readonly confirm = output<FilterOption | FilterOption[] | null>();
  readonly cancel = output<void>();

  private readonly translate = inject(TranslationService);

  readonly selected = signal<FilterOption | FilterOption[] | null>(null);

  constructor() {

    effect(() => {

      const value = this.value();

      if (value === null || (Array.isArray(value) && value.length === 0)) {
        this.selected.set(
          this.multiple() ? [] : null
        );
      } else {
        this.selected.set(value);
      }

    });
  }

  readonly displayLabel = computed(() => {
    const selected = this.selected();

    if (!selected) {
      return this.defaultLabel();
    }

    if (Array.isArray(selected) && selected.length === 0) {
      return this.defaultLabel();
    }

    const text =
      Array.isArray(selected)
        ? selected
          .map(x => this.translate.instant(x.nome))
          .join(', ')
        : this.translate.instant(
          this.getLabelInput(selected) || selected.nome
        );

    return this.showPrefix() && this.prefix() ? `${this.prefix()}: ${text}` : text;

  });

  readonly groupedOptions = computed(() => {

    const groups: Record<string, FilterOption[]> = {};

    for (const option of this.options()) {

      const key = option.group ?? '__ungrouped__';
      groups[key] ??= [];
      groups[key].push(option);

    }

    return groups;

  });

  readonly hasSelection = computed(() => {
    const value = this.selected();

    return Array.isArray(value) ? value.length > 0 : !!value;

  });

  readonly selectedColor = computed(() => {

    const value = this.selected();

    if (!value || Array.isArray(value)) {
      return undefined;
    }

    const found = this.options().find(opt => {

      if (value.group && opt.group) {
        return (opt.id === value.id && opt.group === value.group
        );
      }
      return opt.id === value.id;

    });

    return found?.color;

  });

  compareByNone = () => 0;

  onSelection(option: FilterOption) {

    if (this.multiple()) {
      const current = new Set(this.selected() as FilterOption[] ?? []);

      current.has(option) ? current.delete(option) : current.add(option);

      this.selected.set(Array.from(current));

    } else {

      this.selected.set(option);
      this.confirm.emit(option);

    }

  }

  isSelected(option: FilterOption) {

    const value = this.selected();

    if (Array.isArray(value)) {

      return value.some(
        x => x.nome === option.nome
      );

    }

    return value === option;

  }

  clearSelection(event: MouseEvent) {

    event.stopPropagation();

    const value = this.multiple() ? [] : null;
    this.selected.set(value);
    this.confirm.emit(value);

  }

  getLabelInput(value: FilterOption): string {

    switch (value.nomeCaixa) {

      case 'DISPOSITIVO_ASSOCIADO':
      case 'SIMCARD_ASSOCIADO':

        if (value.nome === 'SIM') {
          return 'ASSOCIADO';
        }

        if (value.nome === 'NAO') {
          return 'NAO_ASSOCIADO';
        }

        return value.nome;

      default:
        return value.nome;
    }
  }

  private defaultLabel() {

    const text = this.translate.instant('TODOS');

    return this.showPrefix() && this.prefix() ? `${this.prefix()}: ${text}` : text;

  }

}
