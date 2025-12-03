# AATRAL Module Registry
# All backend modules must be registered here

from typing import Dict, Any, Callable
from dataclasses import dataclass

@dataclass
class ModuleContract:
    """
    Module contract definition for AATRAL architecture.
    Each module must implement this contract.
    """
    name: str
    description: str
    version: str
    router: Any
    service: Any
    
    def validate(self) -> bool:
        """Validate that module implements required components"""
        required = ['name', 'description', 'version', 'router', 'service']
        return all(hasattr(self, attr) for attr in required)


class ModuleRegistry:
    """Central registry for all AATRAL modules"""
    
    def __init__(self):
        self._modules: Dict[str, ModuleContract] = {}
    
    def register(self, module: ModuleContract) -> None:
        """Register a new module"""
        if not module.validate():
            raise ValueError(f"Module {module.name} does not implement required contract")
        
        self._modules[module.name] = module
        print(f"✓ Registered module: {module.name} v{module.version}")
    
    def get_module(self, name: str) -> ModuleContract:
        """Get a registered module by name"""
        return self._modules.get(name)
    
    def list_modules(self) -> list:
        """List all registered modules"""
        return list(self._modules.keys())
    
    def get_all_routers(self) -> list:
        """Get all module routers for FastAPI registration"""
        return [module.router for module in self._modules.values()]


# Global registry instance
registry = ModuleRegistry()
