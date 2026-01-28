// dropdown-filter.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { NgStyle, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationPipe, TranslationService } from '@angulartoolsdr/translation';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';

export interface FilterOption {
  nome: string;
  id?: number,
  group?: string,
  nomeCaixa?: string,
  icon?: string,
  color?: string
}

@Component({
  selector: 'te-dropdown-filter',
  imports: [NgStyle, KeyValuePipe, MatMenuModule, MatIconButton, FormsModule, TranslationPipe],
  templateUrl: './dropdown-filter.html',
  styleUrls: ['./dropdown-filter.scss'],
})

export class DropdownFilter {

  @Input() options: FilterOption[] = [];
  @Input() multiple = false;
  @Input() prefix?: string;
  @Input() showPrefix = false;

  @Input('value') set setValue(value: FilterOption | FilterOption[] | null) {
    //console.log('setValue', value);
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      this.selected.set(this.multiple ? [] : null);
    } else {
      this.selected.set(value);
    }
  }

  @Output() confirm = new EventEmitter<FilterOption | FilterOption[]>();
  @Output() cancel = new EventEmitter<void>();

  translate = inject(TranslationService);
  selected = signal<FilterOption | FilterOption[] | null>(null);

  compareByNone = () => 0; // função que retorna sempre 0 para desativar o sort

  // Mostra a label combinada com o valor selecionado
  displayLabel = computed(() => {
    const selectedValue = this.selected();  // Store the value first

    if (!selectedValue) {  // Check for null/undefined
      return this.showPrefix && this.prefix ? `${this.prefix}: ${this.translate.instant('TODOS')}` : this.translate.instant('TODOS');
    }

    if (Array.isArray(selectedValue) && selectedValue.length === 0) {  // Check for empty array
      return this.showPrefix && this.prefix ? `${this.prefix}: ${this.translate.instant('TODOS')}` : this.translate.instant('TODOS');
    }

    const value = Array.isArray(selectedValue) ? selectedValue.map(opt => this.translate.instant(opt.nome)).join(', ') : this.translate.instant(selectedValue.nome);

    if (!Array.isArray(selectedValue) && this.getLabelInput(selectedValue)) {
      const returnValue = this.getLabelInput(selectedValue) ? this.translate.instant(this.getLabelInput(selectedValue)) : value;
      return this.showPrefix && this.prefix ? `${this.prefix}: ${returnValue}` : returnValue;
    }

    return this.showPrefix && this.prefix ? `${this.prefix}: ${value}` : value;
  });

  getLabelInput(selectedValue: FilterOption) {
    switch (selectedValue.nomeCaixa) {
      case 'DISPOSITIVO_ASSOCIADO':
      case 'SIMCARD_ASSOCIADO':
        if (selectedValue.nome === 'SIM') {
          return 'ASSOCIADO';
        }
        return 'NAO_ASSOCIADO';

      case 'DISPOSITIVO_ONLINE_OFFLINE':
      case 'SIMCARD_SITUACAO_LINHA':
      case 'SIMCARD_OPERADORA':
        return selectedValue.nome;

      case 'SIMCARD_SITUACAO_CONSUMO':
        if (selectedValue.nome === 'SIM') {
          return 'BLOQUEADO_CONSUMO';
        }
        return 'NAO_BLOQUEADO_CONSUMO';
    }
    return '';
  }

  groupedOptions = computed(() => {
    const groups: Record<string, FilterOption[]> = {};

    for (const option of this.options) {
      const groupKey = option.group || '__ungrouped__';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(option);
    }

    return groups;
  });

  onConfirm() {
    this.confirm.emit(this.selected());
  }

  onCancel() {
    this.cancel.emit();
  }

  isSelected(option: FilterOption): boolean {
    if (Array.isArray(this.selected())) {
      return (this.selected() as FilterOption[]).map(opt => opt.nome).includes(option.nome);
    }
    return this.selected() === option;
  }

  onSelection(option: FilterOption) {
    if (this.multiple) {
      const current = new Set(this.selected() as FilterOption[] || []);
      current.has(option) ? current.delete(option) : current.add(option);
      this.selected.set(Array.from(current));
    } else {
      this.selected.set(option);
      this.confirm.emit(option);
    }
  }

  hasSelection(): boolean {
    const value = this.selected();
    return Array.isArray(value) ? value.length > 0 : !!value;
  }

  clearSelection(event: MouseEvent) {
    event.stopPropagation(); // impede de abrir o menu ao clicar no X
    this.selected.set(this.multiple ? [] : null);
    this.confirm.emit(this.multiple ? [] : null);
  }

  selectedColor(): string | undefined {
    if (!this.selected() || this.multiple) return undefined;

    const selectedValue = this.selected() as FilterOption;

    const selected = this.options.find(opt => {
      const sameId = opt.id === selectedValue.id;
      const hasGroup = !!opt.group;

      if (hasGroup && selectedValue.group) {
        return sameId && opt.group === selectedValue.group;
      }

      return sameId;
    });

    return selected?.color;
  }

}
