import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardScannerModalComponent } from './card-scanner-modal.component';
import { CardOcrService } from '../../../core/services/card-ocr.service';

describe('CardScannerModalComponent', () => {
  let component: CardScannerModalComponent;
  let fixture: ComponentFixture<CardScannerModalComponent>;

  const mockCardOcrService = {
    scanFrontSide: vi.fn().mockResolvedValue({
      cardNumber: '4532015012345678',
      formattedCardNumber: '4532 0150 1234 5678',
      expiryMonth: '12',
      expiryYear: '28',
      cardholderName: 'JOHN DOE',
      cardBrand: 'Visa'
    }),
    scanBackSide: vi.fn().mockResolvedValue({
      cvv: '891'
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardScannerModalComponent],
      providers: [
        { provide: CardOcrService, useValue: mockCardOcrService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CardScannerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  });

  it('should create the modal component and lock document body scroll', () => {
    expect(component).toBeTruthy();
    expect(document.body.classList.contains('modal-open')).toBe(true);
  });

  it('should switch active tab between FRONT and BACK', () => {
    expect(component.activeTab()).toBe('FRONT');
    component.switchTab('BACK');
    expect(component.activeTab()).toBe('BACK');
    component.switchTab('FRONT');
    expect(component.activeTab()).toBe('FRONT');
  });

  it('should determine canAutoFill correctly', () => {
    expect(component.canAutoFill()).toBe(false);
    component.extractedCardNumber = '4532 0150 1234 5678';
    expect(component.canAutoFill()).toBe(true);
  });

  it('should emit cardScanned and close modal on applyAndAutoFill', () => {
    const scanSpy = vi.spyOn(component.cardScanned, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    component.extractedCardNumber = '4532 0150 1234 5678';
    component.extractedCardholderName = 'JOHN DOE';
    component.extractedExpiryMonth = '12';
    component.extractedExpiryYear = '28';
    component.extractedCvv = '891';
    component.extractedBrand = 'Visa';

    component.applyAndAutoFill();

    expect(scanSpy).toHaveBeenCalledWith({
      cardNumber: '4532015012345678',
      cardholderName: 'JOHN DOE',
      expiryMonth: '12',
      expiryYear: '28',
      cvv: '891',
      cardBrand: 'Visa'
    });
    expect(closeSpy).toHaveBeenCalled();
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('should unlock body scroll and emit close event when onClose is called', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });
});
