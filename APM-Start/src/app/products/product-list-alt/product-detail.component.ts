import { ChangeDetectionStrategy, Component } from '@angular/core';
import { catchError, EMPTY, map } from 'rxjs';
import { Supplier } from 'src/app/suppliers/supplier';

import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  errorMessage = '';

  constructor(private productService: ProductService) { }

  product$ = this.productService.selectedProduct$.pipe(
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  pageTitle$ = this.product$
  .pipe(
    map(p => p ? `Product detail for: ${p.productName}` : null)
  );

  productSuppliers$ = this.productService.selectedProductSuppliers$.pipe(
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

}
