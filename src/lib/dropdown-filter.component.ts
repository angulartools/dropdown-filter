// dropdown-filter.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { NgStyle, KeyValuePipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { TranslationPipe, TranslationService } from '@angulartoolsdr/translation';
import { MatMenuModule } from '@angular/material/menu';

export interface FilterOption {
  label: string;
  id?: number,
  group?: string,
  icon?: string,
  color?: string,
  labelInput?: string,
}

@Component({
  selector: 'lib-dropdown-filter',
  imports: [NgStyle, KeyValuePipe, MatMenuModule, MatCard, MatIcon, MatIconButton, FormsModule, TranslationPipe],
  templateUrl: './dropdown-filter.component.html',
  styleUrls: ['./dropdown-filter.component.scss'],
})
export class DropdownFilterComponent {
  @Input() options: FilterOption[] = [];
  @Input() multiple = false;
  @Input() label?: string;
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
  
    const value = Array.isArray(selectedValue) ? selectedValue.map(opt => this.translate.instant(opt.label)).join(', ') : this.translate.instant(selectedValue.label);

      if (!Array.isArray(selectedValue) && selectedValue.labelInput) {
        const returnValue = selectedValue.labelInput ? this.translate.instant(selectedValue.labelInput) : value;
        return this.showPrefix && this.prefix ? `${this.prefix}: ${returnValue}` : returnValue;
      }
  
    return this.showPrefix && this.prefix ? `${this.prefix}: ${value}` : value;
  });

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
      return (this.selected() as FilterOption[]).map(opt => opt.label).includes(option.label);
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
