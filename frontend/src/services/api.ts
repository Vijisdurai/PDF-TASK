import type { DocumentMetadata, Annotation } from '../contexts/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');

export interface UploadResponse {
  document: DocumentMetadata;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: {
            code: 'NETWORK_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }
      throw new Error(errorData.error.message);
    }

    return response.json();
  }

  // Document operations
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const backendResponse = JSON.parse(xhr.responseText);
            // Transform backend response to match frontend interface
            const transformedDocument: DocumentMetadata = {
              id: backendResponse.id || crypto.randomUUID(), // Fallback ID generation
              filename: backendResponse.filename,
              originalFilename: backendResponse.original_filename,
              mimeType: backendResponse.mime_type,
              size: backendResponse.file_size,
              uploadedAt: new Date(backendResponse.created_at),
              convertedPath: backendResponse.converted_path
            };
            const response: UploadResponse = {
              document: transformedDocument,
              message: 'Document uploaded successfully'
            };
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error?.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${API_BASE_URL}/documents/upload`);
      xhr.timeout = 300000; // 5 minutes timeout
      xhr.send(formData);
    });
  }

  async getDocument(documentId: string): Promise<DocumentMetadata> {
    const backendResponse = await this.request<any>(`/documents/${documentId}`);
    return {
      id: backendResponse.id || crypto.randomUUID(),
      filename: backendResponse.filename,
      originalFilename: backendResponse.original_filename,
      mimeType: backendResponse.mime_type,
      size: backendResponse.file_size,
      uploadedAt: new Date(backendResponse.created_at),
      convertedPath: backendResponse.converted_path
    };
  }

  async getDocuments(limit: number = 10000): Promise<DocumentMetadata[]> {
    const backendResponse = await this.request<any[]>(`/documents?limit=${limit}`);
    return backendResponse.map(doc => ({
      id: doc.id || crypto.randomUUID(),
      filename: doc.filename,
      originalFilename: doc.original_filename,
      mimeType: doc.mime_type,
      size: doc.file_size,
      uploadedAt: new Date(doc.created_at),
      convertedPath: doc.converted_path
    }));
  }

  async getDocumentFile(documentId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file`, {
      headers: {
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    });
    if (!response.ok) {
      let errorMessage = `Failed to fetch document file: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use default error message if response is not JSON
      }
      throw new Error(errorMessage);
    }
    return response.blob();
  }

  // Helper method to get document file URL for direct use in components
  getDocumentFileUrl(documentId: string): string {
    return `${API_BASE_URL}/documents/${documentId}/file`;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Annotation operations
  async getAnnotations(documentId: string, page?: number, annotationType?: 'document' | 'image'): Promise<Annotation[]> {
    const params = new URLSearchParams();
    if (page !== undefined) {
      params.append('page', page.toString());
    }
    if (annotationType) {
      params.append('annotation_type', annotationType);
    }
    
    const endpoint = `/annotations/${documentId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<{ annotations: any[] }>(endpoint);
    
    // Transform backend response to frontend format
    return response.annotations.map(ann => this.transformAnnotationFromBackend(ann));
  }

  async createAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
    const payload = this.transformAnnotationToBackend(annotation);
    const response = await this.request<any>('/annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return this.transformAnnotationFromBackend(response);
  }

  async updateAnnotation(annotationId: string, updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>): Promise<Annotation> {
    const payload = this.transformAnnotationUpdateToBackend(updates);
    const response = await this.request<any>(`/annotations/${annotationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return this.transformAnnotationFromBackend(response);
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    await this.request(`/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  }

  // Transform annotation from backend format to frontend format
  private transformAnnotationFromBackend(backendAnnotation: any): Annotation {
    const base = {
      id: backendAnnotation.id,
      documentId: backendAnnotation.document_id,
      content: backendAnnotation.content,
      createdAt: new Date(backendAnnotation.created_at),
      updatedAt: new Date(backendAnnotation.updated_at),
    };

    if (backendAnnotation.annotation_type === 'document') {
      return {
        ...base,
        type: 'document',
        page: backendAnnotation.page,
        xPercent: Number(backendAnnotation.x_percent),
        yPercent: Number(backendAnnotation.y_percent),
      };
    } else {
      return {
        ...base,
        type: 'image',
        xPixel: backendAnnotation.x_pixel,
        yPixel: backendAnnotation.y_pixel,
        color: backendAnnotation.color,
      };
    }
  }

  // Transform annotation from frontend format to backend format
  private transformAnnotationToBackend(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): any {
    if (annotation.type === 'document') {
      return {
        annotation_type: 'document',
        document_id: annotation.documentId,
        page: annotation.page,
        x_percent: annotation.xPercent,
        y_percent: annotation.yPercent,
        content: annotation.content,
      };
    } else {
      return {
        annotation_type: 'image',
        document_id: annotation.documentId,
        x_pixel: annotation.xPixel,
        y_pixel: annotation.yPixel,
        content: annotation.content,
        color: annotation.color,
      };
    }
  }

  // Transform annotation update from frontend format to backend format
  private transformAnnotationUpdateToBackend(updates: Partial<Omit<Annotation, 'id' | 'documentId' | 'createdAt'>>): any {
    const payload: any = {};
    
    if (updates.content !== undefined) {
      payload.content = updates.content;
    }
    
    if ('page' in updates && updates.page !== undefined) {
      payload.page = updates.page;
    }
    
    if ('xPercent' in updates && updates.xPercent !== undefined) {
      payload.x_percent = updates.xPercent;
    }
    
    if ('yPercent' in updates && updates.yPercent !== undefined) {
      payload.y_percent = updates.yPercent;
    }
    
    if ('xPixel' in updates && updates.xPixel !== undefined) {
      payload.x_pixel = updates.xPixel;
    }
    
    if ('yPixel' in updates && updates.yPixel !== undefined) {
      payload.y_pixel = updates.yPixel;
    }
    
    if ('color' in updates && updates.color !== undefined) {
      payload.color = updates.color;
    }
    
    return payload;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;