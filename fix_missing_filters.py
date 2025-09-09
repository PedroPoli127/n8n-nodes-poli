#!/usr/bin/env python3
"""
Script para verificar e corrigir arquivos que têm o import mas não aplicaram o filtro
"""

import os
import re
from pathlib import Path

def find_operation_files():
    """Encontra todos os arquivos de operação"""
    operations_dir = Path("/workspaces/n8n-nodes-poli/nodes/Poli")
    operation_files = []
    
    for file in operations_dir.glob("*.operation.ts"):
        operation_files.append(file)
    
    return operation_files

def check_and_fix_file(file_path):
    """Verifica e corrige um arquivo se necessário"""
    print(f"Verificando: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verifica se tem o import
    has_import = 'processApiResponseForN8n' in content
    
    # Verifica se tem apiRequest GET
    has_api_request = 'apiRequest.call(this, \'GET\'' in content
    
    # Verifica se o filtro já foi aplicado
    has_filter_applied = 'processApiResponseForN8n(responseData' in content
    
    if has_import and has_api_request and not has_filter_applied:
        print(f"  ⚠️  Tem import e apiRequest, mas filtro não aplicado: {file_path.name}")
        
        # Padrão para encontrar linhas que precisam do filtro
        patterns = [
            r'(const responseData = await apiRequest\.call\(this, \'GET\', endpoint\);)\s*\n\s*(returnData\.push\(\{ json: responseData \}\);)',
            r'(const responseData = await apiRequest\.call\(this, \'GET\', endpoint\);)\s*\n\s*(returnData\.push\(\{json: responseData\}\);)',
        ]
        
        content_modified = False
        
        for pattern in patterns:
            if re.search(pattern, content):
                replacement = r'''\1
			
			// Filtra a resposta para remover campos desnecessários
			const filteredData = processApiResponseForN8n(responseData, true);
			returnData.push({ json: filteredData });'''
                
                content = re.sub(pattern, replacement, content)
                content_modified = True
                break
        
        if content_modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Filtro aplicado: {file_path.name}")
            return True
        else:
            print(f"  ❌ Não foi possível aplicar automaticamente: {file_path.name}")
            return False
    
    elif has_import and has_api_request and has_filter_applied:
        print(f"  ✅ Já tem filtro aplicado: {file_path.name}")
        return False
    
    elif not has_api_request:
        print(f"  ℹ️  Não tem apiRequest GET: {file_path.name}")
        return False
    
    else:
        print(f"  ℹ️  Não precisa de filtro: {file_path.name}")
        return False

def main():
    """Função principal"""
    print("🔍 Verificando arquivos que precisam de correção...")
    operation_files = find_operation_files()
    
    fixed_count = 0
    
    for file_path in operation_files:
        if check_and_fix_file(file_path):
            fixed_count += 1
    
    print(f"\n✅ Verificação concluída!")
    print(f"🔧 {fixed_count} arquivos foram corrigidos")

if __name__ == "__main__":
    main()
