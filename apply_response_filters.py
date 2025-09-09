#!/usr/bin/env python3
"""
Script para aplicar filtros de resposta automaticamente em todas as operações
que fazem requisições GET (listagem) do n8n-nodes-poli
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

def is_list_operation(file_path):
    """Verifica se é uma operação de listagem baseada no nome do arquivo"""
    filename = file_path.stem.lower()
    list_keywords = ['list', 'get']
    return any(keyword in filename for keyword in list_keywords)

def has_api_request(content):
    """Verifica se o arquivo contém chamadas para apiRequest"""
    return 'apiRequest.call(this, \'GET\'' in content

def already_has_filter(content):
    """Verifica se o arquivo já tem o filtro aplicado"""
    return 'processApiResponseForN8n' in content

def add_import_if_needed(content):
    """Adiciona o import do filtro se necessário"""
    if 'processApiResponseForN8n' in content:
        return content, False
    
    # Encontra a linha de import do parameterUtils
    pattern = r"import \{ getParameterSafe \} from '\./utils/parameterUtils';"
    replacement = "import { getParameterSafe } from './utils/parameterUtils';\nimport { processApiResponseForN8n } from './utils/responseFilter';"
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        return content, True
    
    return content, False

def add_filter_to_response(content):
    """Adiciona o filtro à resposta da API"""
    if 'processApiResponseForN8n' in content:
        return content, False
    
    # Padrão para encontrar chamadas de API GET
    pattern = r'(const responseData = await apiRequest\.call\(this, \'GET\', endpoint\);)\s*\n\s*(returnData\.push\(\{ json: responseData \}\);)'
    
    replacement = r'''\1
			
			// Filtra a resposta para remover campos desnecessários
			const filteredData = processApiResponseForN8n(responseData, true);
			returnData.push({ json: filteredData });'''
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        return content, True
    
    return content, False

def process_file(file_path):
    """Processa um arquivo individual"""
    print(f"Processando: {file_path.name}")
    
    # Lê o conteúdo do arquivo
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verifica se é uma operação de listagem e se tem apiRequest
    if not is_list_operation(file_path):
        print(f"  ❌ Não é operação de listagem: {file_path.name}")
        return False
    
    if not has_api_request(content):
        print(f"  ❌ Não tem apiRequest GET: {file_path.name}")
        return False
    
    if already_has_filter(content):
        print(f"  ✅ Já tem filtro aplicado: {file_path.name}")
        return False
    
    # Adiciona o import
    content, import_added = add_import_if_needed(content)
    
    # Adiciona o filtro à resposta
    content, filter_added = add_filter_to_response(content)
    
    if import_added or filter_added:
        # Salva o arquivo modificado
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Filtro aplicado com sucesso: {file_path.name}")
        return True
    else:
        print(f"  ⚠️  Não foi possível aplicar o filtro: {file_path.name}")
        return False

def main():
    """Função principal"""
    print("🔍 Procurando arquivos de operação...")
    operation_files = find_operation_files()
    
    print(f"📁 Encontrados {len(operation_files)} arquivos de operação")
    
    processed_count = 0
    
    for file_path in operation_files:
        if process_file(file_path):
            processed_count += 1
    
    print(f"\n✅ Processamento concluído!")
    print(f"📊 {processed_count} arquivos foram modificados")
    print(f"📋 {len(operation_files) - processed_count} arquivos não precisaram de modificação")

if __name__ == "__main__":
    main()
