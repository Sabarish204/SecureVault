import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardPreviewComponent } from './card-preview.component';

describe('CardPreviewComponent', () => {
  let component: CardPreviewComponent;
  let fixture: ComponentFixture<CardPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardPreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardPreviewComponent);
    component = fixture.componentInstance;
    component.cardNumber = '4111222233334444';
    component.cardholderName = 'DEMO USER';
    component.expiryMonth = '12';
    component.expiryYear = '2030';
    fixture.detectChanges();
  });

  it('should initialize and detect Visa card network', () => {
    expect(component).toBeTruthy();
    expect(component.detectedNetwork?.network).toBe('VISA');
    expect(component.detectedNetwork?.name).toBe('Visa');
  });

  it('should detect RuPay network dynamically when card number changes', () => {
    component.cardNumber = '6061123456789012';
    fixture.detectChanges();
    expect(component.detectedNetwork?.network).toBe('RUPAY');
    expect(component.detectedNetwork?.name).toBe('RuPay');
  });

  it('should toggle reveal of card number and CVV', () => {
    expect(component.isNumberRevealed()).toBe(false);
    component.toggleNumberReveal();
    expect(component.isNumberRevealed()).toBe(true);

    expect(component.isCvvRevealed()).toBe(false);
    component.toggleCvvReveal();
    expect(component.isCvvRevealed()).toBe(true);
  });
});
