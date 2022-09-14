import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { BehaviorSubject, catchError, combineLatest, filter, forkJoin, map, merge, Observable, of, scan, shareReplay, Subject, switchMap, tap, throwError } from 'rxjs';

import { Product } from './product';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { Supplier } from '../suppliers/supplier';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = 'api/suppliers';
  
  constructor(private http: HttpClient, private categoryService: ProductCategoryService) { }

  products$ = this.http.get<Product[]>(this.productsUrl)
  .pipe(
    tap(data => console.log('Products: ', JSON.stringify(data))),
    shareReplay(1),
    catchError(this.handleError)
  );

  productsTransformed$ = this.http.get<Product[]>(this.productsUrl)
  .pipe(
    tap(data => console.log('Products: ', JSON.stringify(data))),
    map(products => 
      products.map(product => ({
        ...product,
        price: product.price ? product.price * 1.5 : 0,
        searchKey: [product.productName]
      } as Product))),
    catchError(this.handleError)
  );

  productsWithCategory$ = combineLatest([
    this.products$, 
    this.categoryService.productCategories$
  ]).pipe(
    tap(data => console.log('Products: ', JSON.stringify(data))),
    map(([products, categories]) => 
      products.map(product => ({
        ...product,
        price: product.price ? product.price * 1.5 : 0,
        category: categories.find(c => product.categoryId === c.id)?.name,
        searchKey: [product.productName]
      } as Product))),
    catchError(this.handleError)
  );

  // create a behavior subject for the selection of a product
  private productSelectedSubject = new BehaviorSubject<number>(0);
  // create an observable action from the behavior subject for updating the currently displayed selected product 
  productSelectedAction = this.productSelectedSubject.asObservable();
  
  // create an observable for mapping product selection from the products
  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedAction
  ]).pipe(
    map(([products, selectedProductId]) => products.find(product => product.id === selectedProductId)),
    tap(product => console.log('selected product: ', JSON.stringify(product))),
    shareReplay(1)
  );

  // create a method that will emit the change in product selection
  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  private productInsertSubject = new Subject<Product>();
  productInsertAction$ = this.productInsertSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertAction$
  ).pipe(
    scan((acc, value) => (value instanceof Array) ? [...value] : [...acc, value], [] as Product[])
  );

  addProduct(newProduct? : Product){
    newProduct = newProduct || this.fakeProduct();
    this.productInsertSubject.next(newProduct);
  }

  selectedProductSuppliers$ = this.selectedProduct$
  .pipe(
    filter(product => Boolean(product)),
    switchMap(selectedProduct => {
      if (selectedProduct?.supplierIds){
        return forkJoin(selectedProduct.supplierIds.map(supplierId => 
          this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)))
      } else {
        return of([]);
      }
    }),
    tap(suppliers => console.log('product suppliers ', JSON.stringify(suppliers)))
  );

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.message}`;
    }
    console.error(err);
    return throwError(() => errorMessage);
  }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      category: 'Toolbox',
      quantityInStock: 30
    };
  }

}
