import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BehaviorSubject, catchError, combineLatest, EMPTY, map, Subject } from 'rxjs';
import { ProductCategory } from '../product-categories/product-category';
import { ProductCategoryService } from '../product-categories/product-category.service';

import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  pageTitle = 'Product List';
  errorMessage = '';

  categories$ = this.productCategoryService.productCategories$.pipe(
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  // create an action stream
  private categorySelectedSubject = new BehaviorSubject<number>(0);
  categorySelectionAction$ = this.categorySelectedSubject.asObservable();

  // combined an action stream with a data stream
  products$ = combineLatest([
    this.productService.productsWithCategory$,
    this.categorySelectionAction$
  ])
  .pipe(
    map(([products, selectedCategoryId]) => 
      products.filter(product => selectedCategoryId ? product.categoryId === selectedCategoryId : true
    )),
    catchError(err => {
      this.errorMessage = err;
      return EMPTY;
    })
  );

  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    this.categorySelectedSubject.next(+categoryId);
  }
}
