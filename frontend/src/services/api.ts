import type { DocumentMetadata, Annotation } from '../contexts/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

  async getDocuments(): Promise<DocumentMetadata[]> {
    const backendResponse = await this.request<any[]>('/documents');
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
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/file`);
    if (!response.ok) {
      throw new Error(`Failed to fetch document file: ${response.statusText}`);
    }
    return response.blob();
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // Annotation operations
  async getAnnotations(documentId: string, page?: number): Promise<Annotation[]> {
    const params = new URLSearchParams();
    if (page !== undefined) {
      params.append('page', page.toString());
    }
    
    const endpoint = `/annotations/${documentId}${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<Annotation[]>(endpoint);
  }

  async createAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
    return this.request<Annotation>('/annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(annotation),
    });
  }

  async updateAnnotation(annotationId: string, content: string): Promise<Annotation> {
    return this.request<Annotation>(`/annotations/${annotationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    await this.request(`/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;