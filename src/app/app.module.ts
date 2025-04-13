import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { ENVIRONMENT } from './config/environment.token';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFirestoreModule,
    AngularFireAuthModule
  ],
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    provideFirebaseApp(() => initializeApp(
      {
        "projectId":"ai-developer-dev",
        "appId":"1:36702166875:web:11a043f8a4487b0c86847e",
        "storageBucket":"ai-developer-dev.firebasestorage.app",
        "apiKey":"AIzaSyBVvmqxj3rSNlUs7lseACXs6QKd2WSrVsQ",
        "authDomain":"ai-developer-dev.firebaseapp.com",
        "messagingSenderId":"36702166875"
      }
    )),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
